'use server'
import { doc, setDoc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp  } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from 'firebase/auth';
import { sendEmailInvitation } from './email';

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
//   const friendshipData = {
//     requester_id: requesterId,
//     addressee_id: addresseeEmail, 
//     status: 'PENDING',
//   };

//   await addDoc(collection(db, 'Friendships'), friendshipData);
// };

export const saveFriendship = async (requesterId: string, addresseeEmail: string) => {
  try {
    // Check if user exists
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('email', '==', addresseeEmail));
    const userSnapshot = await getDocs(q);
    
    const invitationToken = generateInviteToken();
    
    if (!userSnapshot.empty) {
      // User exists - create friendship request
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
      // User doesn't exist - create invitation
      const invitationData = {
        requester_id: requesterId,
        addressee_email: addresseeEmail,
        status: 'PENDING',
        invitation_token: invitationToken,
        created_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        email_sent: false // Will be updated by the Cloud Function
      };
      
      // Save invitation to Firestore - this will trigger the email send
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