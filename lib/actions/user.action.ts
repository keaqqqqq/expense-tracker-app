'use server'
import { doc, setDoc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp, updateDoc, or  } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from 'firebase/auth';
import { Group } from '@/types/Group'
import { Friend } from '@/types/Friend';
import { serializeFirebaseData } from '../utils';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '../firebase-admin-config';

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

export const saveFriendship = async (requesterId: string, addresseeEmail: string) => {
  try {
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('email', '==', addresseeEmail));
    const userSnapshot = await getDocs(q);
    
    const invitationToken = generateInviteToken();
    
    if (!userSnapshot.empty) {
      const existingUser = userSnapshot.docs[0];
      const friendshipData = {
        requester_id: requesterId,
        addressee_id: existingUser.id,
        status: 'PENDING',
        created_at: serverTimestamp()
      };
      
      await addDoc(collection(db, 'Friendships'), friendshipData);
      return { success: true, type: 'friendship_request' };
    } else {
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

    const sentFriendshipsQuery = query(
      collection(db, 'Friendships'),
      where('requester_id', '==', userId)
    );
    const sentFriendships = await getDocs(sentFriendshipsQuery);
    sentFriendships.forEach(doc => {
      const data = serializeFirebaseData(doc.data());
      relationships.push({
        ...data,
        id: doc.id,
        type: 'friendship',
        role: 'requester',
        created_at: data.created_at || Date.now(),
      } as Relationship);
    });

    const receivedFriendshipsQuery = query(
      collection(db, 'Friendships'),
      where('addressee_id', '==', userId)
    );
    const receivedFriendships = await getDocs(receivedFriendshipsQuery);
    receivedFriendships.forEach(doc => {
      const data = serializeFirebaseData(doc.data());
      relationships.push({
        ...data,
        id: doc.id,
        type: 'friendship',
        role: 'addressee',
        created_at: data.created_at || Date.now(),
      } as Relationship);
    });

    const sentInvitationsQuery = query(
      collection(db, 'Invitations'),
      where('requester_id', '==', userId)
    );
    const sentInvitations = await getDocs(sentInvitationsQuery);
    sentInvitations.forEach(doc => {
      const data = serializeFirebaseData(doc.data());
      relationships.push({
        ...data,
        id: doc.id,
        type: 'invitation',
        role: 'requester',
        created_at: data.created_at || Date.now(),
      } as Relationship);
    });

    const receivedInvitationsQuery = query(
      collection(db, 'Invitations'),
      where('addressee_email', '==', userId)
    );
    const receivedInvitations = await getDocs(receivedInvitationsQuery);
    receivedInvitations.forEach(doc => {
      const data = serializeFirebaseData(doc.data());
      relationships.push({
        ...data,
        id: doc.id,
        type: 'invitation',
        role: 'addressee',
        created_at: data.created_at || Date.now(),
      } as Relationship);
    });

    return relationships;

  } catch (error) {
    console.error('Error fetching friendships:', error);
    throw error;
  }
}

export async function acceptFriendship(relationshipId: string) {
  try {
    await updateDoc(doc(db, 'Friendships', relationshipId), {
      status: 'ACCEPTED'
    });
    return { success: true };
  } catch (error) {
    console.error('Error accepting friendship:', error);
    throw error;
  }
}

export async function acceptInvitationAndFriendship(addressedEmail: string, requesterId: string) {
  try {
    const adminAuth = getAuth(getFirebaseAdminApp());
    
    const userRecord = await adminAuth.getUserByEmail(addressedEmail);
    
    if (!userRecord) {
      throw new Error('User not found in authentication');
    }

    const addresseeId = userRecord.uid;

    const friendshipData = {
      addressee_id: addresseeId,
      requester_id: requesterId,
      created_at: serverTimestamp(),
      status: 'ACCEPTED'
    };

    const newFriendshipRef = await addDoc(collection(db, 'Friendships'), friendshipData);

    return {
      success: true,
      friendshipId: newFriendshipRef.id
    };

  } catch (error) {
    console.error('Error in acceptInvitationAndFriendship:', error);
    throw error;
  }
}
export const saveGroup = async (groupData: Omit<Group, 'id'>, requesterId: string) => {
  try {
    const processedMembers = await Promise.all(
      groupData.members.map(async (member) => {
        if (!member.email) return member;

        if (member.email === groupData.members[0].email) {
          const creatorDoc = await getDoc(doc(db, 'Users', requesterId));
          if (!creatorDoc.exists()) throw new Error('Creator user not found');
          
          const creatorData = creatorDoc.data();
          return {
            id: requesterId,
            name: creatorData.name,
            email: member.email
          };
        }

        const userQuery = query(
          collection(db, 'Users'),
          where('email', '==', member.email)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          return {
            id: userSnapshot.docs[0].id,
            name: userData.name,
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
            status: 'PENDING'
          };
        }
      })
    );

    const groupRef = await addDoc(collection(db, 'Groups'), {
      ...groupData,
      members: processedMembers,
      created_at: serverTimestamp(),
      creator_id: requesterId
    });

    const result = {
      success: true,
      group_id: groupRef.id,
      pending_invitations: processedMembers.filter(member => 'status' in member && member.status === 'PENDING')
    };

    return serializeFirebaseData(result);
  } catch (error) {
    console.error('Error saving group:', error);
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