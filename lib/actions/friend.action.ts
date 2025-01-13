import { db } from "@/firebase/config";
import { collection, query, where, getDocs, serverTimestamp, addDoc, getDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { getUserFCMToken, NotificationType, sendNotification } from "./notifications";
import { serializeFirebaseData } from "../utils";
import { Friend } from "@/types/Friend";
import { acceptFriendshipAndAddToGroup } from "./group.action";
import { fetchUserData } from "./user.action";

export const saveFriendship = async (requesterId: string, addresseeEmail: string) => {
  try {
    const usersRef = collection(db, 'Users');
    const userQuery = query(usersRef, where('email', '==', addresseeEmail));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const existingUser = userSnapshot.docs[0];
      const addresseeId = existingUser.id;

      const friendshipsRef = collection(db, 'Friendships');
      
      // Check existing friendships
      const asRequesterQuery = query(
        friendshipsRef,
        where('requester_id', '==', requesterId),
        where('addressee_id', '==', addresseeId),
        where('status', 'in', ['PENDING', 'ACCEPTED'])
      );

      const asAddresseeQuery = query(
        friendshipsRef,
        where('requester_id', '==', addresseeId),
        where('addressee_id', '==', requesterId),
        where('status', 'in', ['PENDING', 'ACCEPTED'])
      );

      const [requesterSnapshot, addresseeSnapshot] = await Promise.all([
        getDocs(asRequesterQuery),
        getDocs(asAddresseeQuery)
      ]);

      // Check for existing requests/friendships
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

      // Create new friendship
      const friendshipData = {
        requester_id: requesterId,
        addressee_id: addresseeId,
        status: 'PENDING',
        created_at: serverTimestamp()
      };

      await addDoc(collection(db, 'Friendships'), friendshipData);

      const requesterDoc = await getDoc(doc(db, 'Users', requesterId));
      const requesterName = requesterDoc.data()?.name || 'Someone';
      const requesterImage = requesterDoc.data()?.image;
      const addresseeToken = await getUserFCMToken(addresseeId);

      if (addresseeToken) { 
        try {
          const notificationType = `FRIEND_REQUEST_${requesterId}` as NotificationType;

            await sendNotification(
                addresseeToken,
                notificationType,
                {
                    title: 'New Friend Request',
                    body: `${requesterName} sent you a friend request`,
                    url: '/friends',
                    fromUser: requesterName,
                    requesterId: requesterId,
                    type: notificationType,
                    image: requesterImage

                }
            );
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
      }

      return { success: true, type: 'friendship_request' };
    } else {
      // Handle invitation for non-existing users
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

export const generateInviteToken = () => {
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
    const requesterId = friendshipData.requester_id;

    if (friendshipData.related_group_id) {
      return acceptFriendshipAndAddToGroup(relationshipId, currentUserUid);
    }

    await updateDoc(friendshipRef, {
      status: 'ACCEPTED',
      accepted_at: serverTimestamp()
    });

    const [currentUserDoc] = await Promise.all([
      getDoc(doc(db, 'Users', currentUserUid))
    ]);

    const currentUserData = currentUserDoc.data();
    console.log('Current user data: ' + JSON.stringify(currentUserData));
    const requesterToken = await getUserFCMToken(requesterId);
    if (requesterToken) {
      try {
        const notificationType = `ACCEPT_FRIEND_REQUEST_${currentUserUid}` as NotificationType;

        await sendNotification(
          requesterToken,
          notificationType,
          {
              title: 'Friend Request Accepted',
              body: `${currentUserData?.name || 'Someone'} accepted your friend request`,
              url: '/friends',
              fromUser: currentUserData?.name,
              type: notificationType,
              image: currentUserData?.image
          }
      );
        console.log('Friendship acceptance notification sent successfully');
      } catch (error) {
        console.error('Failed to send friendship acceptance notification:', error);
      }
    }

    return { 
      success: true,
      message: 'Successfully accepted friendship'
    };
  } catch (error) {
    console.error('Error accepting friendship:', error);
    throw error;
  }
}

export const loadFriends = async (uid: string): Promise<Friend[]> => {
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
      console.log('Error loadFriends: ' + error);
      return null;
    }
  });

  const friends = (await Promise.all(friendPromises))
    .filter((friend): friend is Friend => friend !== null);
  return friends;
};

export const removeFriend = async (currentUserId: string, friendId: string) => {
  try {
    if (!currentUserId || !friendId) {
      throw new Error('Missing required parameters');
    }

    const friendData = await fetchUserData(friendId);
    if (!friendData || !friendData.email) {
      throw new Error('Friend user data not found');
    }

    const friendEmail = friendData.email;
    const friendshipsRef = collection(db, 'Friendships');
    const invitationsRef = collection(db, 'Invitations');

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

    const invitationQuery = query(
      invitationsRef,
      where('requester_id', '==', currentUserId),
      where('status', 'in', ['PENDING', 'ACCEPTED'])
    );

    const [snapshot1, snapshot2, invitationSnapshot] = await Promise.all([
      getDocs(q),
      getDocs(q2),
      getDocs(invitationQuery)
    ]);

    const friendshipDocs = [...snapshot1.docs, ...snapshot2.docs];
    
    if (friendshipDocs.length === 0) {
      throw new Error('Friendship not found');
    }

    const batch = writeBatch(db);

    friendshipDocs.forEach((doc) => {
      batch.update(doc.ref, { status: 'REMOVED' });
      batch.delete(doc.ref);
    });

    invitationSnapshot.docs.forEach((doc) => {
      const invitation = doc.data();
      if (invitation.addressee_email === friendEmail) {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};