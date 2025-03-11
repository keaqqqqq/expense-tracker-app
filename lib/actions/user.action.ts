'use server'
import { doc, setDoc, getDoc, collection, query, where, updateDoc, getDocs, or, and} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { User } from 'firebase/auth';
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

export const fetchUserData = async (uid: string) => {
  const userDoc = doc(db, 'Users', uid);
  const userSnapshot = await getDoc(userDoc);

  if (userSnapshot.exists()) {
    return userSnapshot.data();
  } else {
    throw new Error("User not found");
  }
};

export const settledRatio = async (uid: string) => {
  try{
    const settledTransactions = collection(db, 'Transactions');
    const settledQuery = query(
      settledTransactions,
      where('type', '==', 'settle'),
      where('payer_id', '==', uid)
    )
    const receiverQuery = query(
      settledTransactions,
      where('type', '==', 'expense'),
      where('receiver_id', '==', uid),
      where('payer_id', '!=', uid )
    )
    
    const settledQuerySnapshot = await getDocs(settledQuery);
    const receiverQuerySnapshot = await getDocs(receiverQuery);

    const settledCount = settledQuerySnapshot.size;
    const receiverCount = receiverQuerySnapshot.size;

    if ((settledCount || receiverCount) == 0){
      return 0;
    }

    const userDoc = doc(db, 'Users', uid);
    await updateDoc(userDoc, {
      settledRatio: (settledCount/receiverCount)*10
    })
    return (settledCount/receiverCount)*10;
  }catch (e){
    console.log(e);
    return 0;
  }
}

export const expensesCreatedIncrement = async (uid: string)=> {
  const userDoc = doc(db, 'Users', uid);
  const userSnapshot = await getDoc(userDoc);
  const userData = userSnapshot.data();
  
  // Default expensesCreated to 0 if undefined, then increment
  let expensesCreated = userData?.expensesCreated ?? 0;
  await updateDoc(userDoc, {
    expensesCreated: expensesCreated + 10
  })
  return expensesCreated + 10;
}

export const expensesCreatedDefault = async (uid: string)=> {
  const userDoc = doc(db, 'Users', uid);
  const userSnapshot = await getDoc(userDoc);
  const userData = userSnapshot.data();
  
  // Default expensesCreated to 0 if undefined, then increment
  let expensesCreated = userData?.expensesCreated ?? 0;
  await updateDoc(userDoc, {
    expensesCreated: expensesCreated
  })
  return expensesCreated;
}

export const calculateTotalPoint = async (uid: string, expensesCreatedIncrement: number): Promise<number> => {
  try {
    const totalPoint = expensesCreatedIncrement * (await settledRatio(uid));
    return totalPoint;
  } catch (e) {
    console.log(e);
    return 0; // or some error handling
  }
}

export const refreshExpensePayerLeaderboard = async (uid: string) => {
  if (!uid) {
    return null;
  }

  try {
    const expensesCreated = await expensesCreatedIncrement(uid);
    const ratio = await settledRatio(uid);
    const totalPoint = await calculateTotalPoint(uid, expensesCreated);

    const userDoc = doc(db, 'Users', uid);

    await updateDoc(userDoc, {
      expensesCreated: expensesCreated, 
      settledRatio: ratio,              
      totalPoint: totalPoint           
    });
    console.log(expensesCreated);
    console.log("Leaderboard updated successfully!");
  } catch (e) {
    console.log("Error updating leaderboard:", e);
  }
};

export const refreshSettlePayerLeaderboard = async (uid: string) => {
  if (!uid) {
    return null;
  }

  try {
    const expensesCreated = await expensesCreatedDefault(uid);
    const ratio = await settledRatio(uid);
    const totalPoint = await calculateTotalPoint(uid, expensesCreated);

    const userDoc = doc(db, 'Users', uid);

    await updateDoc(userDoc, {
      expensesCreated: expensesCreated, 
      settledRatio: ratio,              
      totalPoint: totalPoint           
    });
    console.log(expensesCreated);
    console.log("Leaderboard updated successfully!");
  } catch (e) {
    console.log("Error updating leaderboard:", e);
  }
};

//retrieve all friends from user
//get all friends's name, image, expensesCreated, settledRatio and totalPoint
//sort it out based on the totalPoint

interface FriendLeaderboardData {
  name: string;
  image: string;
  expensesCreated: number;
  settledRatio: number;
  totalPoint: number;
}

export const getFriendsLeaderboardData = async (userId: string): Promise<FriendLeaderboardData[]> => {
  try {
      const friendshipsCollection = collection(db, 'Friendships');
      const friendshipsQuery = query(
          friendshipsCollection,
          and(
              where('status', '==', 'ACCEPTED'),
              or(
                  where('requester_id', '==', userId),
                  where('addressee_id', '==', userId)
              )
          )
      );

      const friendshipsSnapshot = await getDocs(friendshipsQuery);

      const friendIds = friendshipsSnapshot.docs.map(doc => {
          const data = doc.data();
          return data.requester_id === userId ? data.addressee_id : data.requester_id;
      });

      const userDoc = doc(db, 'Users', userId);
      const userSnapshot = await getDoc(userDoc);
      const userData = userSnapshot.data();

      if (!userData) {
          throw new Error('Current user data not found');
      }

      const currentUserData: FriendLeaderboardData = {
          name: userData.name || 'Unknown User',
          image: userData.image || '',
          expensesCreated: userData.expensesCreated || 0,
          settledRatio: userData.settledRatio || 0,
          totalPoint: userData.totalPoint || 0
      };

      const friendsPromises = friendIds.map(async (friendId: string) => {
          const friendDoc = doc(db, 'Users', friendId);
          const friendSnapshot = await getDoc(friendDoc);
          const friendData = friendSnapshot.data();

          if (!friendData) return null;

          return {
              name: friendData.name || 'Unknown User',
              image: friendData.image || '',
              expensesCreated: friendData.expensesCreated || 0,
              settledRatio: friendData.settledRatio || 0,
              totalPoint: friendData.totalPoint || 0
          };
      });

      const friendsData = await Promise.all(friendsPromises);

      const allData = [currentUserData, ...friendsData.filter((friend): friend is FriendLeaderboardData => friend !== null)];

      return allData.sort((a, b) => b.totalPoint - a.totalPoint);

  } catch (error) {
      console.error('Error fetching friends leaderboard data:', error);
      return [];
  }
};

