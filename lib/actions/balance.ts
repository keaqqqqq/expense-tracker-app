'use server'
import { db } from "@/firebase/config";
import { GroupBalance, Balance, FriendGroupBalance } from "@/types/Balance";
import {GroupMember } from "@/types/Group";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, DocumentData, QuerySnapshot } from "firebase/firestore";
import { fetchUserData } from "./user.action";
import { Transaction } from '@/types/Transaction';
import { cookies } from "next/headers";
import { getFriendships, Relationship } from "./friend.action";

export async function fetchUserBalances(userId: string) {
  try {
    // 1. Get balances from all users as in your original code
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const usersRef = collection(db, 'Users');
    const usersSnap = await getDocs(usersRef);
    
    const balances: Balance[] = [];

    // Get balances where current user is mentioned in other users' balances
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

    // Add current user's balances
    const currentUserData = userSnap.data();
    if (currentUserData.balances && Array.isArray(currentUserData.balances)) {
      currentUserData.balances.forEach((balance: Balance) => {
        const existingBalanceIndex = balances.findIndex(b => b.id === balance.id);
        
        if (existingBalanceIndex === -1) {
          balances.push(balance);
        }
      });
    }

    // 2. Get transactions for settled/unsettled calculations
    const transactionsRef = collection(db, 'Transactions');
    const [payerSnap, receiverSnap] = await Promise.all([
      getDocs(query(transactionsRef, where('payer_id', '==', userId))),
      getDocs(query(transactionsRef, where('receiver_id', '==', userId)))
    ]);

    const transactions = [
      ...payerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...receiverSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ] as Transaction[];

    // 3. Combine balance data with user info and transaction calculations
    const enrichedBalances = await Promise.all(
      balances.map(async (balance) => {
        const friendDoc = await getDoc(doc(db, 'Users', balance.id));
        const friendData = friendDoc.data();

        const { settledBalance, unsettledBalance, directPaymentBalance } = await calculateBalancesFromTransactions(
          transactions,
          userId,
          balance.id
        );

        return {
          id: balance.id,
          name: friendData?.name || 'Unknown User',
          email: friendData?.email || '',
          image: friendData?.image || '/default-avatar.jpg',
          netBalance: balance.balance, // Using the balance from your original logic
          settledBalance,
          unsettledBalance,
          directPaymentBalance
        };
      })
    );

    return enrichedBalances;
  } catch (error) {
    console.error('Error fetching user balances:', error);
    throw error;
  }
}

async function calculateBalancesFromTransactions(
  transactions: Transaction[], 
  userId: string, 
  targetId: string
): Promise<{ settledBalance: number; unsettledBalance: number,  directPaymentBalance: number; }> {
  const relevantTransactions = transactions.filter(t =>
    (t.payer_id === userId && t.receiver_id === targetId) ||
    (t.payer_id === targetId && t.receiver_id === userId)
  );

  const directPaymentTransactions = relevantTransactions.filter(t => 
    (!t.type || t.type === '') && t.group_id === ''
  );

  // Calculate direct payment balance
  const directPaymentBalance = directPaymentTransactions.reduce((sum, t) => {
    // If current user is the payer, it's a positive amount (lending)
    // If current user is the receiver, it's a negative amount (borrowing)
    const amount = t.payer_id === userId ? t.amount : -t.amount;
    return sum + amount;
  }, 0);

  const settleTransactions = relevantTransactions.filter(t => 
    t.type?.toLowerCase() === 'settle' && t.group_id === ''
  );

  const expenseTransactions = relevantTransactions.filter(t => 
    t.type?.toLowerCase() === 'expense' && t.group_id === '' 
  );

  const settledAmount = settleTransactions.reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseAmount = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const unsettledAmount = Math.max(0, totalExpenseAmount - settledAmount);

  return {
    settledBalance: settledAmount,
    unsettledBalance: unsettledAmount,
    directPaymentBalance

  };
}

export async function fetchGroupBalances(userId: string, groupId: string): Promise<GroupBalance[]> {
  try {
    const [groupDoc, transactionsSnap] = await Promise.all([
      getDoc(doc(db, 'Groups', groupId)),
      getDocs(query(
        collection(db, 'Transactions'),
        where('group_id', '==', groupId)
      ))
    ]);
    
    if (!groupDoc.exists()) {
      return [];
    }

    const groupData = groupDoc.data();
    const transactions = transactionsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    
    const currentUserMember = groupData.members.find((member: GroupMember) => member.id === userId);
    
    if (!currentUserMember || !currentUserMember.balances) {
      return [];
    }

    const balances = await Promise.all(currentUserMember.balances.map(async (balance: Balance) => {
      const member = groupData.members.find((m: GroupMember) => m.id === balance.id);
      
      try {
        const memberData = await fetchUserData(balance.id);
        
        // Calculate settled/unsettled balances from transactions
        const { settledBalance, unsettledBalance, directPaymentBalance } = await calculateBalancesFromGroupTransactions(
          transactions,
          userId,
          balance.id
        );
        
        return {
          groupId: groupDoc.id,
          userId: userId,                  
          userName: currentUserMember.name,  
          userEmail: currentUserMember.email,
          memberId: balance.id,            
          memberName: memberData.name || member?.name || 'Unknown',
          memberImage: memberData.image || '/default-avatar.jpg',
          memberEmail: memberData.email || member?.email || '',
          netBalance: balance.balance || 0, 
          settledBalance,
          unsettledBalance,
          directPaymentBalance
        };
      } catch (error) {
        console.error(`Error fetching member data for ${balance.id}:`, error);
        const { settledBalance, unsettledBalance, directPaymentBalance  } = await calculateBalancesFromGroupTransactions(
          transactions,
          userId,
          balance.id
        );
        
        return {
          groupId: groupDoc.id,
          userId: userId,
          userName: currentUserMember.name,
          userEmail: currentUserMember.email,
          memberId: balance.id,
          memberName: member?.name || 'Unknown Member',
          memberImage: '/default-avatar.jpg',
          memberEmail: member?.email || '',
          netBalance: balance.balance || 0, 
          settledBalance,
          unsettledBalance,
          directPaymentBalance 
        };
      }
    }));
    return balances;
  } catch (error) {
    console.error('Error fetching group balances:', error);
    return [];
  }
}

async function calculateBalancesFromGroupTransactions(
  transactions: Transaction[], 
  userId: string, 
  targetId: string
): Promise<{ settledBalance: number; unsettledBalance: number, directPaymentBalance: number; }> {
  const relevantTransactions = transactions.filter(t =>
    (t.payer_id === userId && t.receiver_id === targetId) ||
    (t.payer_id === targetId && t.receiver_id === userId)
  );

    // Direct payment transactions (type is undefined or empty string)
    const directPaymentTransactions = relevantTransactions.filter(t => 
      (!t.type || t.type === '') && t.group_id !== '' && t.expense_id === 'direct-payment'
    );
  
    // Calculate direct payment balance
    const directPaymentBalance = directPaymentTransactions.reduce((sum, t) => {
      // If current user is the payer, it's a positive amount (lending)
      // If current user is the receiver, it's a negative amount (borrowing)
      const amount = t.payer_id === userId ? t.amount : -t.amount;
      return sum + amount;
    }, 0);

  const settleTransactions = relevantTransactions.filter(t => 
    t.type?.toLowerCase() === 'settle' && t.group_id !== ''
  );

  const expenseTransactions = relevantTransactions.filter(t => 
    t.type?.toLowerCase() === 'expense' && t.group_id !== '' 
  );


  const settledAmount = settleTransactions.reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseAmount = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const unsettledAmount = Math.max(0, totalExpenseAmount - settledAmount);

  return {
    settledBalance: settledAmount,
    unsettledBalance: unsettledAmount,
    directPaymentBalance
  };
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
      balances.push({ id: friendId, balance: newBalance });
    } else {
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
    
    const memberIndex = members.findIndex((m: GroupMember) => m.id === userId);
    
    if (memberIndex === -1) {
      throw new Error('User not found in group');
    }

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
  console.log('user id:', userId, 'target Id: ', targetId, 'type: ', type)
  try {
    if (type === 'friend') {
      await Promise.all([
        updateUserBalance(userId, targetId, 0),
        updateUserBalance(targetId, userId, 0)
      ]);
    } else {
      await updateGroupBalance(targetId, userId, 0);
    }
    return true;
  } catch (error) {
    console.error('Error settling balance:', error);
    throw error;
  }
}

interface GroupData extends DocumentData {
    name: string;
    image?: string;
    members: Array<{
      id: string;
      name: string;
      email: string;
      balances?: Array<{
        id: string;
        balance: number;
      }>;
    }>;
  }
  
  
  export async function fetchFriendGroupBalances(userId: string, friendId: string) {
    try {
      // 1. First get all groups and check for shared groups
      const groupsRef = collection(db, 'Groups');
      const groupsSnapshot: QuerySnapshot<DocumentData> = await getDocs(groupsRef);
      
      // Get all group IDs for transaction query
      const groupIds = groupsSnapshot.docs.map(doc => doc.id);
      
      // Fetch transactions for all relevant groups
      const transactionsSnapshot = await getDocs(query(
        collection(db, 'Transactions'),
        where('group_id', 'in', groupIds)
      ));
  
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
  
      const sharedGroups: FriendGroupBalance[] = [];
  
      for (const groupDoc of groupsSnapshot.docs) {
        const groupData = groupDoc.data() as GroupData;
        const members = groupData.members || [];
        const currentUserMember = members.find(member => member.id === userId);
        const friendMember = members.find(member => member.id === friendId);
  
        if (currentUserMember && friendMember) {
          if (currentUserMember.balances && Array.isArray(currentUserMember.balances)) {
            const balanceWithFriend = currentUserMember.balances.find(
              balance => balance.id === friendId
            );
  
            if (balanceWithFriend) {
              // Get group specific transactions
              const groupTransactions = transactions.filter(t => t.group_id === groupDoc.id);
              
              // Calculate settled/unsettled balances
              const { settledBalance, unsettledBalance, directPaymentBalance } = await calculateBalancesFromGroupTransactions(
                groupTransactions,
                userId,
                friendId
              );
  
              try {
                const friendData = await fetchUserData(friendId);
                sharedGroups.push({
                  groupId: groupDoc.id,
                  groupName: groupData.name || 'Unknown Group',
                  groupImage: groupData.image || '/default-group.jpg',
                  userId: userId,
                  userName: currentUserMember.name,
                  userEmail: currentUserMember.email,
                  memberId: friendId,
                  memberName: friendData.name || friendMember.name || 'Unknown',
                  memberImage: friendData.image || '/default-avatar.jpg',
                  memberEmail: friendData.email || friendMember.email || '',
                  netBalance: balanceWithFriend.balance || 0,
                  settledBalance,
                  unsettledBalance,
                  directPaymentBalance
                });
              } catch (error) {
                console.error(`Error fetching friend data for ${friendId}:`, error);
                sharedGroups.push({
                  groupId: groupDoc.id,
                  groupName: groupData.name || 'Unknown Group',
                  groupImage: groupData.image || '/default-group.jpg',
                  userId: userId,
                  userName: currentUserMember.name,
                  userEmail: currentUserMember.email,
                  memberId: friendId,
                  memberName: friendMember.name || 'Unknown',
                  memberImage: '/default-avatar.jpg',
                  memberEmail: friendMember.email || '',
                  netBalance: balanceWithFriend.balance || 0,
                  settledBalance,
                  unsettledBalance,
                  directPaymentBalance
                });
              }
            }
          }
        }
      }
      return sharedGroups;
    } catch (error) {
      console.error('Error fetching friend group balances:', error);
      return [];
    }
  }
  
  
  export async function fetchAllFriendBalances(userId: string) {
    try {
      const relationships = await getFriendships(userId);
      const acceptedFriends = relationships
        .filter((rel: Relationship) => rel.status === 'ACCEPTED')
        .map((rel: Relationship) => {
          const friendId = rel.requester_id === userId ? rel.addressee_id : rel.requester_id;
          if (!friendId) return null;
          return friendId;
        })
        .filter((id): id is string => id !== null); 
  
      if (acceptedFriends.length === 0) {
        return [];
      }
  
      const allBalances = await Promise.all([
        fetchUserBalances(userId),
        ...acceptedFriends.map(friendId => 
          fetchFriendGroupBalances(userId, friendId)
        )
      ]);
  
      const [directBalances, ...groupBalances] = allBalances;
      
      const combinedBalances = await Promise.all(
        acceptedFriends.map(async (friendId, index) => {
          try {
            const friendData = await fetchUserData(friendId);
            const directBalance = directBalances.find(b => b.id === friendId)?.netBalance || 0;
            const groupBalance = groupBalances[index].reduce(
              (total, group) => total + group.netBalance, 
              0
            );
  
            return {
              friendId,
              name: friendData?.name || 'Unknown',
              image: friendData?.image,
              directBalance,
              groupBalance,
              totalBalance: directBalance + groupBalance,
              groups: groupBalances[index]
            };
          } catch (error) {
            console.error(`Error processing friend ${friendId}:`, error);
            return {
              friendId,
              name: 'Unknown User',
              image: '/default-avatar.jpg',
              directBalance: 0,
              groupBalance: 0,
              totalBalance: 0,
              groups: []
            };
          }
        })
      );
  
      return combinedBalances.filter(balance => balance !== null);
    } catch (error) {
      console.error('Error fetching all friend balances:', error);
      return [];
    }
  }
  
  export async function refreshBalances() {
    const cookieStore = cookies();
    const uid = cookieStore.get('currentUserUid')?.value;
    if (!uid) {
      throw new Error('User not authenticated');
    }
    return fetchAllFriendBalances(uid);
  }
  