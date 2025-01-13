'use client'
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  fetchUserBalances, 
  fetchGroupBalances, 
  fetchFriendGroupBalances,
  settleBalance 
} from '@/lib/actions/user.action';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, getDoc } from 'firebase/firestore';
import Toast from '@/components/Toast';
import { Balance, GroupBalance, FriendGroupBalance } from '@/types/Balance';
import { createTransactionApi, fetchTransactions } from '@/lib/actions/transaction';
import { Transaction } from '@/types/Transaction';
import { getUserFCMToken } from '@/lib/actions/notifications';
import { sendNotification } from '@/lib/actions/notifications';
import { useExpenseList } from './ExpenseListContext';
interface BalancesContextState {
  balances: Balance[];
  groupBalances: GroupBalance[];
  friendGroupBalances: FriendGroupBalance[];
  isLoading: boolean;
  totalBalance: number;
  toast: {
    message: string;
    type: 'success' | 'error';
  } | null;
}

interface BalancesContextValue extends BalancesContextState {
  updateBalances: (newBalances: Balance[]) => void;
  refreshBalances: (userId: string, friendId?: string) => Promise<void>;
  setToast: (message: string, type: 'success' | 'error') => void;
  calculateTotalBalance: (friendId: string) => number;
  handleSettleBalance: (
    userId: string, 
    friendId: string, 
    type: 'friend' | 'group', 
    group?: string,
    fromPage?: 'friend' | 'group'
  ) => Promise<{ expense_id: string; payer: string; receiver: string; amount: number; }[]>;
}

interface BalancesProviderProps {
  children: React.ReactNode;
  userId: string;
  initialBalances?: Balance[];
  initialGroupBalances?: GroupBalance[];
  initialFriendGroupBalances?: FriendGroupBalance[]; 
  groupId?: string;
}

const BalancesContext = createContext<BalancesContextValue | undefined>(undefined);

export function BalancesProvider({ 
  children, 
  userId,
  initialBalances = [],
  initialGroupBalances = [],
  initialFriendGroupBalances = [], 
  groupId
}: BalancesProviderProps) {
  const [state, setState] = useState<BalancesContextState>({
    balances: initialBalances,
    groupBalances: initialGroupBalances,
    friendGroupBalances: initialFriendGroupBalances,
    isLoading: false,
    totalBalance: 0,
    toast: null
  });
  const { 
    refreshTransactions, 
    refreshGroupTransactions} = useExpenseList();
  const calculateTotalBalance = useCallback((friendId: string) => {
    const directBalance = state.balances.find(balance => balance.id === friendId)?.netBalance || 0;
    
    const groupBalancesSum = state.friendGroupBalances.reduce((sum, groupBalance) => {
      if (groupBalance.memberId === friendId) {
        return sum + (groupBalance.netBalance || 0); // Changed from balance to netBalance
      }
      return sum;
    }, 0);

    return directBalance + groupBalancesSum;
  }, [state.balances, state.friendGroupBalances]);

  useEffect(() => {
    if (!userId) return;
  
    const unsubscribeHandlers: (() => void)[] = [];
  
    // Listen for changes in user's balances
    const userRef = doc(db, 'Users', userId);
    const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
      if (userDoc.exists()) {
        try {
          const newBalances = await fetchUserBalances(userId);
          setState(prev => ({
            ...prev,
            balances: newBalances
          }));
        } catch (error) {
          console.error('Error updating balances:', error);
        }
      }
    });
    unsubscribeHandlers.push(unsubscribeUser);
  
    // Listen for changes in group balances if groupId is provided
    if (groupId) {
      const groupRef = doc(db, 'Groups', groupId);
      const unsubscribeGroup = onSnapshot(groupRef, async (groupDoc) => {
        if (groupDoc.exists()) {
          try {
            const newGroupBalances = await fetchGroupBalances(userId, groupId);
            setState(prev => ({
              ...prev,
              groupBalances: newGroupBalances
            }));
          } catch (error) {
            console.error('Error updating group balances:', error);
          }
        }
      });
      unsubscribeHandlers.push(unsubscribeGroup);
    }
  
    // Listen for changes in all users' balances
    const usersRef = collection(db, 'Users');
    const unsubscribeOtherUsers = onSnapshot(usersRef, async () => {
      try {
        const newBalances = await fetchUserBalances(userId);
        setState(prev => ({
          ...prev,
          balances: newBalances
        }));
      } catch (error) {
        console.error('Error updating balances from other users:', error);
      }
    });
    unsubscribeHandlers.push(unsubscribeOtherUsers);
  
    return () => {
      unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, groupId]);

  const setToast = useCallback((message: string, type: 'success' | 'error') => {
    setState(prev => ({
      ...prev,
      toast: { message, type }
    }));
  }, []);

  const clearToast = useCallback(() => {
    setState(prev => ({
      ...prev,
      toast: null
    }));
  }, []);

  const updateBalances = useCallback((newBalances: Balance[]) => {
    setState(prev => ({
      ...prev,
      balances: newBalances
    }));
  }, []);

  const refreshBalances = useCallback(async (userId: string, friendId?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const [newBalances, newGroupBalances, newFriendGroupBalances] = await Promise.all([
        fetchUserBalances(userId),
        groupId ? fetchGroupBalances(userId, groupId) : Promise.resolve([]),
        friendId ? fetchFriendGroupBalances(userId, friendId) : Promise.resolve([])
      ]);

      setState(prev => ({
        ...prev,
        balances: newBalances,
        groupBalances: newGroupBalances,
        friendGroupBalances: newFriendGroupBalances,
        isLoading: false
      }));
    } catch (error) {
      setToast('Failed to refresh balances', 'error');
      console.error('Error refreshing balances:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [groupId, setToast]);

  async function getExpenseDescription(expenseId: string): Promise<string> {
    if (!expenseId || expenseId === "direct-transfer") return "(direct-payment)";
    
    const expenseDoc = await getDoc(doc(db, 'Expenses', expenseId));
    return expenseDoc.exists() ? expenseDoc.data().description : "(direct-payment)";
}

const getFormattedDate = (): string => {
  const date = new Date();
  return date.toISOString().slice(0, 10);
};

const handleSettleBalance = async (
    userId: string,
    friendId: string,
    type: string,
    group?: string,
    fromPage?: 'friend' | 'group'
) => {
  let transactions = await fetchTransactions(userId, friendId);
  
  transactions = transactions.filter((t) => t.group_id === (group?group:""));
  
  // Group transactions by expense_id
  const transactionsByExpense: { [expenseId: string]: Transaction[] } = {};
  transactions.forEach((t) => {
    if(!t.expense_id)t.expense_id= "direct-transfer"
    if (!transactionsByExpense[t.expense_id]) {
      transactionsByExpense[t.expense_id] = [];
    }
    transactionsByExpense[t.expense_id].push(t);
  });

  const balances: { expense_id: string; payer: string; receiver: string; amount: number }[] =
    [];

  // Calculate balances for each expense_id
  Object.keys(transactionsByExpense).forEach((expenseId) => {
    const expenseTransactions = transactionsByExpense[expenseId];
    const balanceMap: { [key: string]: number } = {};

    // Sum up balances for this expense
    expenseTransactions.forEach((t) => {
      const { payer_id, receiver_id, amount } = t;

      // Add to payer's balance (negative because they paid)
      balanceMap[payer_id] = (balanceMap[payer_id] || 0) - amount;

      // Add to receiver's balance (positive because they received)
      balanceMap[receiver_id] = (balanceMap[receiver_id] || 0) + amount;
    });

    // Resolve balances and push them to the output array
    Object.keys(balanceMap).forEach((person) => {
      const balance = balanceMap[person];
      if (balance > 0) {
        // Positive balance means this person is owed money
        Object.keys(balanceMap).forEach((otherPerson) => {
          if (balanceMap[otherPerson] < 0) {
            const payment = Math.min(balance, -balanceMap[otherPerson]);
            if (payment > 0) {
              balances.push({
                expense_id: expenseId,
                receiver: otherPerson,
                payer: person,
                amount: payment,
              });

              balanceMap[person] -= payment;
              balanceMap[otherPerson] += payment;
            }
          }
        });
      }
    });
  });


  for (const b of balances) {
      await createTransactionApi({
          payer_id: b.payer,
          receiver_id: b.receiver,
          group_id: group || "",
          expense_id: b.expense_id || "direct-payment",
          created_at: getFormattedDate(),
          amount: b.amount,
          type: (b.expense_id && b.expense_id!=="direct-payment") ? "settle": "",
      });

      try {
        const payerDoc = await getDoc(doc(db, 'Users', b.payer));
        const payerData = payerDoc.data();
        console.log('Payer data:', payerData);
        
        const receiverToken = await getUserFCMToken(friendId);
        console.log('Receiver token:', receiverToken);
        
        if (receiverToken) {
            const notificationType = `EXPENSE_SETTLED_${b.payer}_${b.receiver}_${Math.floor(Date.now() / 1000)}`;
    
            const expenseDescription = await getExpenseDescription(b.expense_id);
    
            const notificationData = {
                title: 'Payment Settled',
                body: `${payerData?.name || 'Someone'} settled a payment${expenseDescription ? ` for ${expenseDescription}` : ''}: RM${b.amount}`,
                url: group ? `/groups/${group}` : `/friends/${userId}`,
                type: notificationType,
                image: payerData?.image || ''
            };
    
            await sendNotification(receiverToken, notificationType, notificationData);
        } else {
            console.log('No receiver token found for:', friendId);
        }
    } catch (error) {
        console.error('Settlement notification error:', error);
    }
  }

  setToast('All transactions are settled', 'success');

  switch (fromPage) {
    case 'friend':
        await refreshTransactions(friendId);
      break;
    case 'group':
        if (group) {
            await refreshGroupTransactions(group);
        }
        break;
  }

  return balances;
};
  

  return (
    <BalancesContext.Provider 
      value={{ 
        ...state,
        updateBalances,
        refreshBalances,
        handleSettleBalance,
        setToast,
        calculateTotalBalance
      }}
    >
      {children}
      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type}
          onClose={clearToast}
        />
      )}
    </BalancesContext.Provider>
  );
}

export const useBalances = () => {
  const context = useContext(BalancesContext);
  if (!context) {
    throw new Error('useBalances must be used within a BalancesProvider');
  }
  return context;
};