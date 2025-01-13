import { db } from "@/firebase/config";
import { FirestoreGroupData, Group, GroupMember } from "@/types/Group";
import { getDoc, doc, query, collection, where, getDocs, serverTimestamp, addDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { serializeFirebaseData } from "../utils";
import { getUserFCMToken, NotificationType, sendNotification } from "./notifications";
import { generateInviteToken } from "./friend.action";
export const saveGroup = async (groupData: Omit<Group, 'id'>, requesterId: string) => {
  try {
    if (!groupData.name || !groupData.members || groupData.members.length === 0) {
      throw new Error('Missing required group data: name and members are required');
    }

    const processedMembers = await Promise.all(
      groupData.members.map(async (member) => {
        if (!member.email) return member;

        if (member.email === groupData.members[0].email) {
          const creatorDoc = await getDoc(doc(db, 'Users', requesterId));
          if (!creatorDoc.exists()) throw new Error('Creator user not found');
          
          const creatorData = creatorDoc.data();
          return {
            id: requesterId,
            name: creatorData.name || 'Unknown',
            email: member.email,
            image: member.image || null
          };
        }

        const userQuery = query(
          collection(db, 'Users'),
          where('email', '==', member.email)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          const userId = userSnapshot.docs[0].id;

          const friendshipAcceptedQuery = query(
            collection(db, 'Friendships'),
            where('requester_id', 'in', [requesterId, userId]),
            where('addressee_id', 'in', [requesterId, userId]),
            where('status', '==', 'ACCEPTED'),
          );

          const friendshipAcceptedSnapshot = await getDocs(friendshipAcceptedQuery);

          if (friendshipAcceptedSnapshot.empty) {
            const friendshipPendingQuery = query(
              collection(db, 'Friendships'),
              where('requester_id', 'in', [requesterId, userId]),
              where('addressee_id', 'in', [requesterId, userId]),
              where('status', '==', 'PENDING'),
            );
            const friendshipPendingSnapshot = await getDocs(friendshipPendingQuery);



            if (friendshipPendingSnapshot.empty) {

            const friendshipData = {
              requester_id: requesterId,
              addressee_id: userId,
              created_at: serverTimestamp(),
              status: 'PENDING',
              related_group_id: null, 
              related_group_name: groupData.name
            };

            await addDoc(collection(db, 'Friendships'), friendshipData);
          } else {
            await updateDoc(friendshipPendingSnapshot.docs[0].ref, {
              related_group_name: groupData.name,
              related_group_id: null, 
            });
          }

            return {
              email: member.email,
              id: userId,
              name: userData.name || 'Unknown',
              status: 'PENDING_FRIENDSHIP',
              message: 'Friendship request sent'
            };
          }

          return {
            id: userId,
            name: userData.name || 'Unknown',
            email: member.email
          };
        } else {
          const invitationToken = generateInviteToken();
          const invitationData = {
            requester_id: requesterId,
            addressee_email: member.email,
            status: 'PENDING',
            invitation_token: invitationToken,
            created_at: serverTimestamp(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            email_sent: false,
            group_name: groupData.name
          };

          await addDoc(collection(db, 'Invitations'), invitationData);
          
          return {
            email: member.email,
            invitation_token: invitationToken,
            status: 'PENDING_INVITATION'
          };
        }
      })
    );

    const validProcessedMembers = processedMembers.filter(Boolean);

    const activeMembers = validProcessedMembers.filter(
      member => !member.status || member.status === 'ACCEPTED'
    );

    const pendingFriendships = validProcessedMembers.filter(
      member => member.status === 'PENDING_FRIENDSHIP'
    );

    const pendingInvitations = validProcessedMembers.filter(
      member => member.status === 'PENDING_INVITATION'
    );

    const groupRef = await addDoc(collection(db, 'Groups'), {
      ...groupData,
      members: activeMembers,
      created_at: serverTimestamp(),
      creator_id: requesterId,
      pending_members: [...pendingFriendships, ...pendingInvitations]
    });

    const friendshipUpdates = pendingFriendships.map(async (member) => {
      const friendshipQuery = query(
        collection(db, 'Friendships'),
        where('requester_id', '==', requesterId),
        where('addressee_id', '==', member.id),
        where('status', '==', 'PENDING')
      );
      
      const friendshipSnapshot = await getDocs(friendshipQuery);
      if (!friendshipSnapshot.empty) {
        await updateDoc(friendshipSnapshot.docs[0].ref, {
          related_group_id: groupRef.id
        });
      }
    });

     const creatorDoc = await getDoc(doc(db, 'Users', requesterId));
     const creatorData = creatorDoc.data();
 
     const notificationPromises = activeMembers
       .filter(member => member.id && member.id !== requesterId) 
       .map(async (member) => {
         try {
          if(!member.id){
            return null;
          }
           const memberToken = await getUserFCMToken(member.id);
           if (memberToken) {
             const notificationType = `GROUP_INVITE_${groupRef.id}` as NotificationType;
             
             await sendNotification(
               memberToken,
               notificationType,
               {
                 title: 'New Group Added',
                 body: `${creatorData?.name || 'Someone'} added you to ${groupData.name}`,
                 url: `/groups/${groupRef.id}`,
                 fromUser: creatorData?.name,
                 type: notificationType,
                 image: creatorData?.image, 
                 groupId: groupRef.id,
                 groupName: groupData.name
               }
             );
           }
         } catch (error) {
           console.error(`Failed to send notification to member ${member.id}:`, error);
         }
       });
 
     await Promise.all([
       ...friendshipUpdates,
       ...notificationPromises
     ]);

    const result = {
      success: true,
      group_id: groupRef.id,
      pending_friendships: pendingFriendships,
      pending_invitations: pendingInvitations
    };

    return serializeFirebaseData(result);
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
};

export const acceptFriendshipAndAddToGroup = async (
  friendshipId: string,
  currentUserId: string
) => {
  try {
    const friendshipRef = doc(db, 'Friendships', friendshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (!friendshipDoc.exists()) {
      throw new Error('Friendship not found');
    }

    const friendshipData = friendshipDoc.data();
    const groupId = friendshipData.related_group_id;

    await updateDoc(friendshipRef, {
      status: 'ACCEPTED',
      accepted_at: serverTimestamp()
    });

    if (groupId) {
      const userDoc = await getDoc(doc(db, 'Users', currentUserId));
      if (!userDoc.exists()) throw new Error('User not found');
      
      const userData = userDoc.data();

      const groupRef = doc(db, 'Groups', groupId);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) throw new Error('Group not found');

      const groupData = groupDoc.data();

      const newMember = {
        id: currentUserId,
        email: userData.email || '',
        name: userData.name || '',
        image: userData.image || '',
        status: 'ACCEPTED'  
      };

      const updatedPendingMembers = (groupData.pending_members || [])
        .filter((member: GroupMember) => 
          member.id !== currentUserId && 
          member.email !== userData.email
        );

      await updateDoc(groupRef, {
        members: arrayUnion(newMember),
        pending_members: updatedPendingMembers
      });
    }

    return { 
      success: true, 
      message: groupId 
        ? 'Successfully accepted friendship and added to group' 
        : 'Successfully accepted friendship'
    };
  } catch (error) {
    console.error('Error accepting friendship and adding to group:', error);
    throw error;
  }
};

export async function getGroups(userEmail: string): Promise<Group[]> {
  try {
    const groupsRef = collection(db, 'Groups');
    
    const groupsSnapshot = await getDocs(groupsRef);
    const groupsData = groupsSnapshot.docs
      .filter(doc => {
        const data = doc.data() as FirestoreGroupData;
        return data.members?.some(member => member.email === userEmail) ||
               data.pending_members?.some(member => member.email === userEmail);
      })
      .map(doc => ({
        id: doc.id,
        ...(doc.data() as FirestoreGroupData)
      }));

    if (groupsData.length === 0) {
      return [];
    }

    const memberEmails = new Set<string>();
    groupsData.forEach(group => {
      group.members?.forEach((member: GroupMember) => {
        if (member?.email) memberEmails.add(member.email);
      });
      group.pending_members?.forEach((member: GroupMember) => {
        if (member?.email) memberEmails.add(member.email);
      });
    });

    const userDataMap = new Map<string, { name: string, image: string }>();

    if (memberEmails.size > 0) {
      const usersRef = collection(db, 'Users');
      const usersSnapshot = await getDocs(query(
        usersRef, 
        where('email', 'in', Array.from(memberEmails))
      ));

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.email) {
          userDataMap.set(userData.email, {
            name: userData.name,
            image: userData.image || ''
          });
        }
      });
    }

    const groupsWithMembers: Group[] = groupsData.map(group => ({
      id: group.id,
      name: group.name,
      type: group.type,
      image: group.image || '',
      members: group.members.map(member => {
        if (!member?.email) {
          throw new Error('Invalid member data: email is required');
        }
        const userData = userDataMap.get(member.email);
        return {        
          email: member.email,
          id: member.id,
          name: userData?.name,
          image: userData?.image,
          status: 'ACTIVE'
        };
      }),
      pending_members: group.pending_members?.map(member => {
        if (!member?.email) {
          throw new Error('Invalid member data: email is required');
        }
        const userData = userDataMap.get(member.email);
        return {
          email: member.email,
          id: member.id,
          name: userData?.name,
          image: userData?.image,
          status: member.status || 'PENDING'
        };
      }) || []
    }));

    return groupsWithMembers;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
}

export async function getGroupDetails(groupId: string): Promise<Group | null> {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      return null;
    }

    const groupData = groupSnap.data() as FirestoreGroupData;
    
    const memberEmails = new Set<string>();
    groupData.members.forEach(member => {
      if (member.email) memberEmails.add(member.email);
    });

    const usersRef = collection(db, 'Users');
    const usersQuery = query(
      usersRef, 
      where('email', 'in', Array.from(memberEmails))
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    const userDataMap = new Map<string, { name: string, image: string }>();
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      if (userData.email) {
        userDataMap.set(userData.email, {
          name: userData.name,
          image: userData.image || ''
        });
      }
    });

    return {
      id: groupSnap.id,
      name: groupData.name,
      type: groupData.type,
      image: groupData.image || '',
      members: groupData.members.map(member => {
        if (!member || typeof member.email !== 'string') {
          throw new Error('Invalid member data: email is required');
        }
        const userData = userDataMap.get(member.email);
        return {
          email: member.email,
          id: member.id,
          name: userData?.name,
          image: userData?.image
        };
      })
    };

  } catch (error) {
    console.error('Error fetching group details:', error);
    throw error;
  }
}

export const updateGroup = async (groupId: string, groupData: Omit<Group, 'id'>, requesterId: string) => {
    try {
      const groupRef = doc(db, 'Groups', groupId);
      const groupSnapshot = await getDoc(groupRef);
      
      if (!groupSnapshot.exists()) {
        throw new Error('Group not found');
      }
  
      const currentGroup = groupSnapshot.data();
      const currentMembers = new Set(currentGroup.members.map((m: GroupMember) => m.email));
      
      const originalCreator = currentGroup.members[0];
  
      const otherMembers = groupData.members.slice(1);
      const processedMembers = await Promise.all(
        otherMembers.map(async (member) => {
          if (!member.email) return member;
  
          if (currentMembers.has(member.email)) {
            const existingMember = currentGroup.members.find((m: GroupMember) => m.email === member.email);
            if (existingMember) return {
              ...existingMember,
              balances: existingMember.balances || [] 
            };
          }
  
          const userQuery = query(
            collection(db, 'Users'),
            where('email', '==', member.email)
          );
          const userSnapshot = await getDocs(userQuery);
          
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            const userId = userSnapshot.docs[0].id;
  
            const friendshipAcceptedQuery = query(
              collection(db, 'Friendships'),
              where('requester_id', 'in', [requesterId, userId]),
              where('addressee_id', 'in', [requesterId, userId]),
              where('status', '==', 'ACCEPTED'),
            );
  
            const friendshipAcceptedSnapshot = await getDocs(friendshipAcceptedQuery);
  
            if (friendshipAcceptedSnapshot.empty) {
              const friendshipPendingQuery = query(
                collection(db, 'Friendships'),
                where('requester_id', 'in', [requesterId, userId]),
                where('addressee_id', 'in', [requesterId, userId]),
                where('status', '==', 'PENDING'),
              );
              const friendshipPendingSnapshot = await getDocs(friendshipPendingQuery);
  
              if (friendshipPendingSnapshot.empty) {
                const friendshipData = {
                  requester_id: requesterId,
                  addressee_id: userId,
                  created_at: serverTimestamp(),
                  status: 'PENDING',
                  related_group_id: groupId,
                  related_group_name: groupData.name
                };
  
                await addDoc(collection(db, 'Friendships'), friendshipData);
              } else {
                await updateDoc(friendshipPendingSnapshot.docs[0].ref, {
                  related_group_name: groupData.name,
                  related_group_id: groupId,
                });
              }
  
              return {
                email: member.email,
                id: userId,
                name: userData.name,
                status: 'PENDING_FRIENDSHIP',
                message: 'Friendship request sent',
                balances: [] 
              };
            }
  
            const existingMember = currentGroup.members.find((m: GroupMember) => m.id === userId);
            return {
              id: userId,
              name: userData.name,
              email: member.email,
              balances: existingMember?.balances || [] 
            };
          } else {
            const invitationToken = generateInviteToken();
            const invitationData = {
              requester_id: requesterId,
              addressee_email: member.email,
              status: 'PENDING',
              invitation_token: invitationToken,
              created_at: serverTimestamp(),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              email_sent: false,
              group_name: groupData.name,
              group_id: groupId
            };
  
            await addDoc(collection(db, 'Invitations'), invitationData);
            
            return {
              email: member.email,
              invitation_token: invitationToken,
              status: 'PENDING_INVITATION',
              balances: [] 
            };
          }
        })
      );
  
      const activeMembers = processedMembers.filter(
        member => !member.status || member.status === 'ACCEPTED'
      );
  
      const pendingFriendships = processedMembers.filter(
        member => member.status === 'PENDING_FRIENDSHIP'
      );
  
      const pendingInvitations = processedMembers.filter(
        member => member.status === 'PENDING_INVITATION'
      );
  
      await updateDoc(groupRef, {
        name: groupData.name,
        type: groupData.type,
        image: groupData.image,
        members: [originalCreator, ...activeMembers], 
        updated_at: serverTimestamp(),
        pending_members: [...pendingFriendships, ...pendingInvitations]
      });
  
      const result = {
        success: true,
        group_id: groupId,
        pending_friendships: pendingFriendships,
        pending_invitations: pendingInvitations
      };
  
      return serializeFirebaseData(result);
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  };
  
  export const getOrCreateGroupInviteLink = async (groupId: string, requesterId: string) => {
    try {
      const groupInvitesRef = collection(db, 'GroupInvites');
      const q = query(
        groupInvitesRef,
        where('group_id', '==', groupId),
        where('requester_id', '==', requesterId)
      );
  
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        const inviteData = {
          requester_id: requesterId,
          group_id: groupId,
          invitation_token: Math.random().toString(36).substring(7),
          created_at: serverTimestamp()
        };
        
        await addDoc(collection(db, 'GroupInvites'), inviteData);
        return inviteData.invitation_token;
      }
  
      return snapshot.docs[0].data().invitation_token;
    } catch (error) {
      console.error('Error with group invite:', error);
      return null;
    }
  };
  
  export const validateGroupInvite = async (token: string) => {
    try {
      const q = query(
        collection(db, 'GroupInvites'),
        where('invitation_token', '==', token)
      );
  
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return snapshot.docs[0].data();
    } catch (error) {
      console.error('Error validating group invite:', error);
      return null;
    }
  };