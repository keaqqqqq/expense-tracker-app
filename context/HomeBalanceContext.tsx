'use client'
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FriendBalance, SettlementBalance } from "@/types/Balance";
import { createTransactionApi } from '@/lib/actions/transaction';
import { Transaction } from '@/types/Transaction';
import Cookies from 'js-cookie';
import { getUserFCMToken } from '@/lib/actions/notifications';
import { sendNotification } from '@/lib/actions/notifications';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Toast from '@/components/Toast';
import { fetchTransactions } from '@/lib/actions/transaction';
interface HomeBalanceContextType {
  friendBalances: FriendBalance[];
  setFriendBalances: (balances: FriendBalance[]) => void;
  updateBalances: (newBalances: FriendBalance[]) => void;
  handleSettleFriend: (friendId: string) => Promise<SettlementBalance[]>;

}

const BalanceContext = createContext<HomeBalanceContextType | undefined>(undefined);


interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export function BalanceProvider({ 
  children,
  initialBalances 
}: { 
  children: React.ReactNode;
  initialBalances: FriendBalance[];
}) {
  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>(initialBalances);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success'
  });
  const updateBalances = useCallback((newBalances: FriendBalance[]) => {
    setFriendBalances(newBalances);
  }, []);

  const getFormattedDate = (): string => {
    const date = new Date();
    return date.toISOString().slice(0, 10);
  };

  async function getExpenseDescription(expenseId: string): Promise<string> {
    if (!expenseId || expenseId === "direct-transfer") return "(direct-payment)";
    
    const expenseDoc = await getDoc(doc(db, 'Expenses', expenseId));
    return expenseDoc.exists() ? expenseDoc.data().description : "(direct-payment)";
}

const handleSettleFriend = async (friendId: string): Promise<SettlementBalance[]> => {  
  const userId = Cookies.get('currentUserUid')||'';
  const transactions = await fetchTransactions(userId, friendId);
  
  const transactionsByExpense: { [expenseId: string]: Transaction[] } = {};
  transactions.forEach((t) => {
    if(!t.expense_id)t.expense_id= "direct-transfer"
    if (!transactionsByExpense[t.expense_id]) {
      transactionsByExpense[t.expense_id] = [];
    }
    transactionsByExpense[t.expense_id].push(t);
  });

  const balances: SettlementBalance[] = [];

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
            if (payment > 0 && expenseId!=="direct-payment") {
              balances.push({
                expense_id: expenseId,
                receiver: otherPerson,
                payer: person,
                amount: payment,
                group_id: transactions.find(t => t.expense_id === expenseId)?.group_id||"",
              });

              balanceMap[person] -= payment;
              balanceMap[otherPerson] += payment;
            }
          }
        });
      }
    });
  });

  const directPaymentBalances: { [groupId: string]: { payer: string; receiver: string; amount: number }[] } = {};
 
  transactions
    .filter((t) => t.expense_id === "direct-payment")
    .forEach((t) => {
      const { payer_id, receiver_id, amount, group_id } = t;

      if (!directPaymentBalances[group_id || ""]) {
        directPaymentBalances[group_id || ""] = [];
      }
      directPaymentBalances[group_id || ""].push({
        payer: payer_id,
        receiver: receiver_id,
        amount,
      });
    });


  Object.keys(directPaymentBalances).forEach((groupId)=>{
    const directPaymentBalance = directPaymentBalances[groupId];
    const directPaymentMap: {[key:string]:number} = {};

    directPaymentBalance.forEach((t) => {
      const { payer, receiver, amount } = t;

      // Add to payer's balance (negative because they paid)
      directPaymentMap[payer] = (directPaymentMap[payer] || 0) - amount;

      // Add to receiver's balance (positive because they received)
      directPaymentMap[receiver] = (directPaymentMap[receiver] || 0) + amount;
    });

    // Resolve balances and push them to the output array
    Object.keys(directPaymentMap).forEach((person) => {
      const balance = directPaymentMap[person];
      if (balance > 0) {
        // Positive balance means this person is owed money
        Object.keys(directPaymentMap).forEach((otherPerson) => {
          if (directPaymentMap[otherPerson] < 0) {
            const payment = Math.min(balance, -directPaymentMap[otherPerson]);
            if (payment > 0) {
              balances.push({
                expense_id: "direct-payment",
                receiver: otherPerson,
                payer: person,
                amount: payment,
                group_id: groupId,
              });

              directPaymentMap[person] -= payment;
              directPaymentMap[otherPerson] += payment;
            }
          }
        });
      }
    });
  })

  for (const b of balances) {
    await createTransactionApi({
      payer_id: b.payer,
      receiver_id: b.receiver,
      group_id: b.group_id,
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
          url: '/home',
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

  const updatedFriendBalances = friendBalances.map(fb => {
    if (fb.friendId === friendId) {
      return {
        ...fb,
        totalBalance: 0,
        directBalance: 0,
        groupBalance: 0,
        groups: fb.groups.map(group => ({
          ...group,
          netBalance: 0
        }))
      };
    }
    return fb;
  });

    updateBalances(updatedFriendBalances);

    setToast({
      show: true,
      message: 'All transactions are settled',
      type: 'success'
    });

    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  
  return balances;
};

  return (
    <BalanceContext.Provider value={{ friendBalances, setFriendBalances, updateBalances, handleSettleFriend }}>
      {children}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}