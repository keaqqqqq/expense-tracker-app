'use server'
import { doc, setDoc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, orderBy, arrayUnion, Timestamp, writeBatch, and, or  } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from 'firebase/auth';
import { Group } from '@/types/Group';
import { Friend } from '@/types/Friend';
import { serializeFirebaseData } from '../utils';
import { FirestoreGroupData } from '@/types/Group';
import { GroupMember } from '@/types/Group';
import { Expense, GroupedTransactions, Transaction,  } from '@/types/ExpenseList';
export const updateUserProfile = async (
  currentUser: User | null,
  name: string,
  image: string | null
) => {
  if (!currentUser) throw new Error("User not authenticated");

  const userData = {
    name,
    image,
    email: currentUser.email,
  };
  console.log(userData)
  await setDoc(doc(db, 'Users', currentUser.uid), userData);
};

export const handleImageChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setImage: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

export const saveMemberList = async (
  currentUser: User | null,
  memberList?: Array<{ email: string }> 
) => {
  if (!currentUser) throw new Error("User not authenticated");

  const userData = {
    memberList,
  };

  await setDoc(doc(db, 'Users', currentUser.uid), userData, { merge: true }); 
};

export const fetchUserData = async (uid: string) => {
  const userDoc = doc(db, 'Users', uid);
  const userSnapshot = await getDoc(userDoc);

  if (userSnapshot.exists()) {
    return userSnapshot.data();
  } else {
    throw new Error("User not found");
  }
};

// export const saveFriendship = async (requesterId: string, addresseeEmail: string) => {
//   try {
//     const usersRef = collection(db, 'Users');
//     const q = query(usersRef, where('email', '==', addresseeEmail));
//     const userSnapshot = await getDocs(q);
    
//     const invitationToken = generateInviteToken();
    
//     if (!userSnapshot.empty) {
//       const existingUser = userSnapshot.docs[0];
//       const friendshipData = {
//         requester_id: requesterId,
//         addressee_id: existingUser.id,
//         status: 'PENDING',
//         created_at: serverTimestamp()
//       };
      
//       await addDoc(collection(db, 'Friendships'), friendshipData);
//       return { success: true, type: 'friendship_request' };
//     } else {
//       const invitationData = {
//         requester_id: requesterId,
//         addressee_email: addresseeEmail,
//         status: 'PENDING',
//         invitation_token: invitationToken,
//         created_at: serverTimestamp(),
//         expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
//         email_sent: false 
//       };
      
//       await addDoc(collection(db, 'Invitations'), invitationData);
//       return { success: true, type: 'invitation_sent' };
//     }
//   } catch (error) {
//     console.error('Error in saveFriendship:', error);
//     throw error;
//   }
// };

export const saveFriendship = async (requesterId: string, addresseeEmail: string) => {
  try {
    // First get the potential addressee's user record
    const usersRef = collection(db, 'Users');
    const userQuery = query(usersRef, where('email', '==', addresseeEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const existingUser = userSnapshot.docs[0];
      const addresseeId = existingUser.id;

      // Check if there's already a friendship (in either direction)
      const friendshipsRef = collection(db, 'Friendships');
      
      // Check as requester
      const asRequesterQuery = query(
        friendshipsRef,
        where('requester_id', '==', requesterId),
        where('addressee_id', '==', addresseeId),
        where('status', 'in', ['PENDING', 'ACCEPTED'])
      );

      // Check as addressee
      const asAddresseeQuery = query(
        friendshipsRef,
        where('requester_id', '==', addresseeId),
        where('addressee_id', '==', requesterId),
        where('status', 'in', ['PENDING', 'ACCEPTED'])
      );

      // Check both queries
      const [requesterSnapshot, addresseeSnapshot] = await Promise.all([
        getDocs(asRequesterQuery),
        getDocs(asAddresseeQuery)
      ]);

      // If either query returns results, there's an existing relationship
      if (!requesterSnapshot.empty) {
        const friendship = requesterSnapshot.docs[0].data();
        if (friendship.status === 'PENDING') {
          return { 
            success: false, 
            error: 'A friend request is already pending with this user.' 
          };
        } else if (friendship.status === 'ACCEPTED') {
          return { 
            success: false, 
            error: 'You are already friends with this user.' 
          };
        }
      }

      if (!addresseeSnapshot.empty) {
        const friendship = addresseeSnapshot.docs[0].data();
        if (friendship.status === 'PENDING') {
          return { 
            success: false, 
            error: 'This user has already sent you a friend request.' 
          };
        } else if (friendship.status === 'ACCEPTED') {
          return { 
            success: false, 
            error: 'You are already friends with this user.' 
          };
        }
      }

      // If no existing friendship, create new friendship request
      const friendshipData = {
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'PENDING',
        created_at: serverTimestamp()
      };
      
      await addDoc(collection(db, 'Friendships'), friendshipData);
      return { success: true, type: 'friendship_request' };
    } else {
      // Check if there's a pending invitation
      const invitationsRef = collection(db, 'Invitations');
      const existingInvitationQuery = query(
        invitationsRef,
        where('requester_id', '==', requesterId),
        where('addressee_email', '==', addresseeEmail),
        where('status', '==', 'PENDING')
      );

      const existingInvitation = await getDocs(existingInvitationQuery);

      if (!existingInvitation.empty) {
        return { 
          success: false, 
          error: 'An invitation is already pending for this email.' 
        };
      }

      // If no existing invitation, create new one
      const invitationToken = generateInviteToken();
      const invitationData = {
        requester_id: requesterId,
        addressee_email: addresseeEmail,
        status: 'PENDING',
        invitation_token: invitationToken,
        created_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        email_sent: false 
      };
      
      await addDoc(collection(db, 'Invitations'), invitationData);
      return { success: true, type: 'invitation_sent' };
    }
  } catch (error) {
    console.error('Error in saveFriendship:', error);
    throw error;
  }
};


const generateInviteToken = () => {
  return Math.random().toString(36).substr(2) + Date.now().toString(36);
};

export const validateInvitation = async (token: string) => {
  try {
    const invitationsRef = collection(db, 'Invitations');
    const q = query(invitationsRef, where('invitation_token', '==', token));
    const invitationSnapshot = await getDocs(q);

    if (invitationSnapshot.empty) {
      return { valid: false, message: 'Invitation not found' };
    }

    const invitation = invitationSnapshot.docs[0].data();
    
    if (invitation.expires_at.toDate() < new Date()) {
      return { valid: false, message: 'Invitation has expired' };
    }

    if (invitation.status === 'ACCEPTED') {
      return { valid: false, message: 'Invitation has already been used' };
    }

    return {
      valid: true,
      data: {
        email: invitation.addressee_email,
        requesterId: invitation.requester_id
      }
    };
  } catch (error) {
    console.error('Error validating invitation:', error);
    throw error;
  }
};

export interface Relationship {
  id: string;
  type: 'friendship' | 'invitation';
  role: 'requester' | 'addressee';
  status: 'PENDING' | 'ACCEPTED';
  requester_id: string;
  addressee_id?: string;
  addressee_email?: string;
  created_at: Date;
}

export async function getFriendships(userId: string): Promise<Relationship[]> {
  try {
    const relationships: Relationship[] = [];
    const existingFriendships = new Set(); 

    const [sentFriendships, receivedFriendships, sentInvitations, receivedInvitations] = await Promise.all([
      getDocs(query(collection(db, 'Friendships'), where('requester_id', '==', userId))),
      getDocs(query(collection(db, 'Friendships'), where('addressee_id', '==', userId))),
      getDocs(query(collection(db, 'Invitations'), where('requester_id', '==', userId))),
      getDocs(query(collection(db, 'Invitations'), where('addressee_email', '==', userId)))
    ]);

    const processedFriendships = await Promise.all([
      ...sentFriendships.docs.map(doc => {
        const data = serializeFirebaseData(doc.data());
        existingFriendships.add(data.addressee_id);
        return {
          ...data,
          id: doc.id,
          type: 'friendship',
          role: 'requester',
          created_at: data.created_at || Date.now(),
        } as Relationship;
      }),
      ...receivedFriendships.docs.map(doc => {
        const data = serializeFirebaseData(doc.data());
        existingFriendships.add(data.requester_id);
        return {
          ...data,
          id: doc.id,
          type: 'friendship',
          role: 'addressee',
          created_at: data.created_at || Date.now(),
        } as Relationship;
      })
    ]);
    
    relationships.push(...processedFriendships);

    const emailsToCheck = sentInvitations.docs.map(doc => 
      serializeFirebaseData(doc.data()).addressee_email
    );
    
    const usersSnapshot = emailsToCheck.length > 0 ? await getDocs(
      query(
        collection(db, 'Users'),
        where('email', 'in', emailsToCheck)
      )
    ) : { docs: [] };

    const emailToUserMap = new Map(
      usersSnapshot.docs.map(doc => [doc.data().email, doc.id])
    );

    const sentInvitationsProcessed = sentInvitations.docs
      .map(doc => {
        const data = serializeFirebaseData(doc.data());
        const registeredUserId = emailToUserMap.get(data.addressee_email);
        
        if (!registeredUserId || !existingFriendships.has(registeredUserId)) {
          return {
            ...data,
            id: doc.id,
            type: 'invitation',
            role: 'requester',
            created_at: data.created_at || Date.now(),
          } as Relationship;
        }
        return null;
      })
      .filter((invitation): invitation is Relationship => invitation !== null);

    const receivedInvitationsProcessed = receivedInvitations.docs
      .map(doc => {
        const data = serializeFirebaseData(doc.data());
        if (!existingFriendships.has(data.requester_id)) {
          return {
            ...data,
            id: doc.id,
            type: 'invitation',
            role: 'addressee',
            created_at: data.created_at || Date.now(),
          } as Relationship;
        }
        return null;
      })
      .filter((invitation): invitation is Relationship => invitation !== null);

    relationships.push(...sentInvitationsProcessed, ...receivedInvitationsProcessed);

    return relationships;

  } catch (error) {
    console.error('Error fetching friendships:', error);
    throw error;
  }
}

export async function acceptFriendship(relationshipId: string) {
  try {
    const friendshipRef = doc(db, 'Friendships', relationshipId);
    const friendshipDoc = await getDoc(friendshipRef);

    if (!friendshipDoc.exists()) {
      throw new Error('Friendship not found');
    }

    const friendshipData = friendshipDoc.data();
    const currentUserUid = friendshipData.addressee_id; 

    if (friendshipData.related_group_id) {
      return acceptFriendshipAndAddToGroup(relationshipId, currentUserUid);
    }

    await updateDoc(friendshipRef, {
      status: 'ACCEPTED',
      accepted_at: serverTimestamp()
    });

    return { 
      success: true,
      message: 'Successfully accepted friendship'
    };
  } catch (error) {
    console.error('Error accepting friendship:', error);
    throw error;
  }
}

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

    await Promise.all(friendshipUpdates);

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

    // Update friendship status first
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

      // Ensure member structure is consistent
      const newMember = {
        id: currentUserId,
        email: userData.email || '',
        name: userData.name || '',
        image: userData.image || '',
        status: 'ACCEPTED'  // Add explicit status
      };

      // Remove from pending members first
      const updatedPendingMembers = (groupData.pending_members || [])
        .filter((member: any) => 
          member.id !== currentUserId && 
          member.email !== userData.email
        );

      // Then add to active members
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


export const loadFriends = async (uid: string): Promise<Friend[]> => {
  try {
    const [requesterSnapshot, addresseeSnapshot] = await Promise.all([
      getDocs(query(
        collection(db, 'Friendships'),
        where('requester_id', '==', uid),
        where('status', '==', 'ACCEPTED')
      )),
      getDocs(query(
        collection(db, 'Friendships'),
        where('addressee_id', '==', uid),
        where('status', '==', 'ACCEPTED')
      ))
    ]);

    const friendIds = new Set<string>();
    [...requesterSnapshot.docs, ...addresseeSnapshot.docs].forEach(doc => {
      const data = doc.data();
      const friendId = data.requester_id === uid ? data.addressee_id : data.requester_id;
      friendIds.add(friendId);
    });

    if (friendIds.size === 0) {
      return [];
    }

    const friendPromises = Array.from(friendIds).map(async friendId => {
      try {
        const userDoc = doc(db, 'Users', friendId);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          return {
            id: friendId,
            name: userData.name || 'Unknown',
            email: userData.email || '',
            image: userData.image || ''
          };
        } else {
          return null;
        }
      } catch (error) {
        return null;
      }
    });

    const friends = (await Promise.all(friendPromises))
      .filter((friend): friend is Friend => friend !== null);
    return friends;

  } catch (error) {
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

    let userDataMap = new Map<string, { name: string, image: string }>();

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

export const fetchExpenseData = async (expenseId: string): Promise<Expense | undefined> => {
  try {
    // Instead of querying by field, get the document directly by ID
    const expenseDoc = doc(db, 'Expenses', expenseId);
    const expenseSnapshot = await getDoc(expenseDoc);

    if (!expenseSnapshot.exists()) return undefined;

    // Serialize the data right when we get it from Firestore
    const rawData = expenseSnapshot.data();

    // Convert Firebase Timestamp to JavaScript Date
    if (rawData.date instanceof Timestamp) {
      rawData.date = rawData.date.toDate();
    }
    if (rawData.created_at instanceof Timestamp) {
      rawData.created_at = rawData.created_at.toDate();
    }

    const serializedData = serializeFirebaseData(rawData);
    return serializedData as Expense;
  } catch (error) {
    console.error('Error fetching expense:', error);
    return undefined;
  }
};


export const fetchTransactions = async (currentUserId: string, friendId: string): Promise<GroupedTransactions[]> => {
  try {
    const transactionsRef = collection(db, 'Transactions');
    
    // Query where current user is payer and friend is receiver
    const currentUserPayerQ = query(
      transactionsRef,
      where('payer_id', '==', currentUserId),
      where('receiver_id', '==', friendId),
      where('group_id', '==', null),
      orderBy('created_at', 'desc')
    );
    
    // Query where friend is payer and current user is receiver
    const friendPayerQ = query(
      transactionsRef,
      where('payer_id', '==', friendId),
      where('receiver_id', '==', currentUserId),
      where('group_id', '==', null),
      orderBy('created_at', 'desc')
    );

    // Fetch both sets of transactions
    const [currentUserPayerSnapshot, friendPayerSnapshot] = await Promise.all([
      getDocs(currentUserPayerQ),
      getDocs(friendPayerQ)
    ]);

    // Combine and serialize transactions immediately
    const transactions = [...currentUserPayerSnapshot.docs, ...friendPayerSnapshot.docs]
      .map(doc => ({
        ...serializeFirebaseData(doc.data()) as Transaction,
        id: doc.id // Include the document ID
      }))
      .filter((transaction, index, self) =>
        index === self.findIndex(t =>
          t.id === transaction.id // Use document ID for uniqueness check
        )
      );

    // Group transactions with unique keys for direct payments
    const groupedTransactions: { [key: string]: Transaction[] } = {};
    for (const transaction of transactions) {
      // Create a unique key using both timestamp and document ID for direct payments
      const key = transaction.expense_id === 'direct-payment' || !transaction.expense_id
        ? `direct-payment-${transaction.id}` // Use document ID instead of timestamp
        : transaction.expense_id;
      
      if (!groupedTransactions[key]) {
        groupedTransactions[key] = [];
      }
      groupedTransactions[key].push(transaction);
    }

    // Create the final grouped result
    const result: GroupedTransactions[] = await Promise.all(
      Object.entries(groupedTransactions).map(async ([key, transactions]) => {
        let expense: Expense | undefined;

        // Only fetch expense data if it's not a direct payment
        if (!key.startsWith('direct-payment')) {
          expense = await fetchExpenseData(key);
        }

        return {
          expense,
          transactions: transactions.sort((a, b) => {
            if (a.type === 'settle' && b.type !== 'settle') return -1;
            if (a.type !== 'settle' && b.type === 'settle') return 1;
            return 0;
          })
        };
      })
    );

    // Sort the final result by the most recent transaction in each group
    return result.sort((a, b) => {
      const aDate = new Date(a.transactions[0].created_at).getTime();
      const bDate = new Date(b.transactions[0].created_at).getTime();
      return bDate - aDate; // Sort in descending order (most recent first)
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const fetchGroupTransactions = async (groupId: string): Promise<GroupedTransactions[]> => {
  try {
    const transactionsRef = collection(db, 'Transactions');
    
    // Single query for all group transactions
    const groupTransactionsQ = query(
      transactionsRef,
      where('group_id', '==', groupId),
      orderBy('created_at', 'desc')
    );

    const groupTransactionsSnapshot = await getDocs(groupTransactionsQ);
    // Serialize transactions
    const transactions = groupTransactionsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        if (data.created_at instanceof Timestamp) {
          data.created_at = data.created_at.toDate();
        }
        return serializeFirebaseData(data) as Transaction;
      })
      .filter((transaction, index, self) =>
        index === self.findIndex(t =>
          t.created_at === transaction.created_at &&
          t.payer_id === transaction.payer_id &&
          t.receiver_id === transaction.receiver_id
        )
      );

    // Group transactions
    const groupedTransactions: { [key: string]: Transaction[] } = {};
    for (const transaction of transactions) {
      const key = transaction.expense_id || 'direct-payment';
      if (!groupedTransactions[key]) {
        groupedTransactions[key] = [];
      }
      groupedTransactions[key].push(transaction);
    }

    // Create the final grouped result
    const result: GroupedTransactions[] = await Promise.all(
      Object.entries(groupedTransactions).map(async ([key, transactions]) => {
        let expense: Expense | undefined;
        if (key !== 'direct-payment') {
          expense = await fetchExpenseData(key);
        }
        return {
          expense,
          transactions: transactions.sort((a, b) => {
            if (a.type === 'settle' && b.type !== 'settle') return -1;
            if (a.type !== 'settle' && b.type === 'settle') return 1;
            return 0;
          })
        };
      })
    );

    return result;
  } catch (error) {
    console.error('Error fetching group transactions:', error);
    return [];
  }
};

export const removeFriend = async (currentUserId: string, friendId: string) => {
  try {
    if (!currentUserId || !friendId) {
      throw new Error('Missing required parameters');
    }

    const friendshipsRef = collection(db, 'Friendships');
    const q = query(
      friendshipsRef,
      where('status', '==', 'ACCEPTED'),
      where('requester_id', '==', currentUserId),
      where('addressee_id', '==', friendId)
    );

    const q2 = query(
      friendshipsRef,
      where('status', '==', 'ACCEPTED'),
      where('requester_id', '==', friendId),
      where('addressee_id', '==', currentUserId)
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q),
      getDocs(q2)
    ]);

    const docs = [...snapshot1.docs, ...snapshot2.docs];
    
    if (docs.length === 0) {
      throw new Error('Friendship not found');
    }

    const batch = writeBatch(db);
    docs.forEach((doc) => {
      // First update status to trigger listeners
      batch.update(doc.ref, { status: 'REMOVED' });
      // Then delete
      batch.delete(doc.ref);
    });
    await batch.commit();

    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

export async function fetchUserBalances(userId: string) {
  try {
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const usersRef = collection(db, 'Users');
    const usersSnap = await getDocs(usersRef);
    
    const balances: Balance[] = [];

    usersSnap.forEach((doc) => {
      const userData = doc.data();
      if (userData.balances && Array.isArray(userData.balances)) {
        const userBalance = userData.balances.find(
          (b: Balance) => b.id === userId
        );
        
        if (userBalance) {
          balances.push({
            id: doc.id,
            balance: -userBalance.balance 
          });
        }
      }
    });

    const currentUserData = userSnap.data();
    if (currentUserData.balances && Array.isArray(currentUserData.balances)) {
      currentUserData.balances.forEach((balance: Balance) => {
        const existingBalanceIndex = balances.findIndex(b => b.id === balance.id);
        
        if (existingBalanceIndex === -1) {
          balances.push(balance);
        }
      });
    }

    console.log('Fetched balances:', balances);
    return balances;
  } catch (error) {
    console.error('Error fetching user balances:', error);
    throw error;
  }
}


export async function fetchGroupBalances(userId: string, groupId: string) {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return [];
    }

    const groupData = groupDoc.data();
    
    const currentUserMember = groupData.members.find((member: any) => member.id === userId);
    
    if (!currentUserMember || !currentUserMember.balances) {
      return [];
    }

    const balances = await Promise.all(currentUserMember.balances.map(async (balance: any) => {
      const member = groupData.members.find((m: any) => m.id === balance.id);
      
      try {
        const memberData = await fetchUserData(balance.id);
        
        return {
          groupId: groupDoc.id,
          userId: userId,                  
          userName: currentUserMember.name,  
          userEmail: currentUserMember.email,
          memberId: balance.id,            
          memberName: memberData.name || member?.name || 'Unknown',
          memberImage: memberData.image || '/default-avatar.jpg',
          memberEmail: memberData.email || member?.email || '',
          memberBalance: balance.balance || 0
        };
      } catch (error) {
        console.error(`Error fetching member data for ${balance.id}:`, error);
        return {
          groupId: groupDoc.id,
          userId: userId,
          userName: currentUserMember.name,
          userEmail: currentUserMember.email,
          memberId: balance.id,
          memberName: member?.name || 'Unknown Member',
          memberImage: '/default-avatar.jpg',
          memberEmail: member?.email || '',
          memberBalance: balance.balance || 0
        };
      }
    }));

    return balances;
  } catch (error) {
    console.error('Error fetching group balances:', error);
    return [];
  }
}

export async function updateUserBalance(userId: string, friendId: string, newBalance: number) {
  try {
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();
    const balances = userData.balances || [];
    
    const balanceIndex = balances.findIndex((b: Balance) => b.id === friendId);
    
    if (balanceIndex === -1) {
      // Add new balance
      balances.push({ id: friendId, balance: newBalance });
    } else {
      // Update existing balance
      balances[balanceIndex].balance = newBalance;
    }

    await updateDoc(userRef, {
      balances: balances
    });

    return balances;
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw error;
  }
}

export async function updateGroupBalance(groupId: string, userId: string, newBalance: number) {
  try {
    const groupRef = doc(db, 'Groups', groupId);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }

    const groupData = groupSnap.data();
    const members = groupData.members || [];
    
    const memberIndex = members.findIndex((m: any) => m.id === userId);
    
    if (memberIndex === -1) {
      throw new Error('User not found in group');
    }

    // Update member's balance
    if (!members[memberIndex].balances) {
      members[memberIndex].balances = [];
    }

    if (members[memberIndex].balances.length === 0) {
      members[memberIndex].balances.push({ balance: newBalance });
    } else {
      members[memberIndex].balances[0].balance = newBalance;
    }

    await updateDoc(groupRef, {
      members: members
    });

    return members[memberIndex].balances;
  } catch (error) {
    console.error('Error updating group balance:', error);
    throw error;
  }
}

export async function settleBalance(
  userId: string, 
  targetId: string, 
  type: 'friend' | 'group'
) {
  try {
    if (type === 'friend') {
      // Update both users' balances to 0
      await Promise.all([
        updateUserBalance(userId, targetId, 0),
        updateUserBalance(targetId, userId, 0)
      ]);
    } else {
      // Update group balance to 0
      await updateGroupBalance(targetId, userId, 0);
    }
    return true;
  } catch (error) {
    console.error('Error settling balance:', error);
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
    const currentMembers = new Set(currentGroup.members.map((m: any) => m.email));

    const processedMembers = await Promise.all(
      groupData.members.map(async (member) => {
        if (!member.email) return member;

        // If it's the creator
        if (member.email === groupData.members[0].email) {
          const creatorDoc = await getDoc(doc(db, 'Users', requesterId));
          if (!creatorDoc.exists()) throw new Error('Creator user not found');
          
          const creatorData = creatorDoc.data();
          // Find creator's existing balances from current group
          const existingCreator = currentGroup.members.find((m: any) => m.id === requesterId);
          return {
            id: requesterId,
            name: creatorData.name,
            email: member.email,
            balances: existingCreator?.balances || [] // Preserve creator's balances
          };
        }

        // If member already exists in the group
        if (currentMembers.has(member.email)) {
          const existingMember = currentGroup.members.find((m: any) => m.email === member.email);
          if (existingMember) return {
            ...existingMember,
            balances: existingMember.balances || [] // Preserve existing member's balances
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
            // Handle pending friendship case
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
              balances: [] // New pending friend starts with empty balances
            };
          }

          // Check if this user was previously in the group to preserve their balances
          const existingMember = currentGroup.members.find((m: any) => m.id === userId);
          return {
            id: userId,
            name: userData.name,
            email: member.email,
            balances: existingMember?.balances || [] // Preserve balances if they existed before
          };
        } else {
          // Handle invitation case
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
            balances: [] // New invited member starts with empty balances
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
      members: activeMembers, // Now includes preserved balances
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