'use client'
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from '@/context/AuthContext';
import { createTransactionApi, fetchTransactions } from '@/api/transaction';
import { Transaction } from '@/types/Transaction';
import { doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getUserFCMToken } from '@/lib/actions/notifications';
import Cookies from 'js-cookie';

interface GroupBalance {
  name: string;
  balance: number;
}

interface HomeBalanceCardProps {
  friendId: string;
  name: string;
  image?: string;
  directBalance: number;
  groupBalances?: GroupBalance[];
  totalBalance: number;
}

export function HomeBalanceCard({ 
  friendId,
  name, 
  image, 
  directBalance,
  groupBalances = [],
  totalBalance
}: HomeBalanceCardProps) {
  const formattedDirectAmount = Math.abs(directBalance).toFixed(2);
  const formattedTotalAmount = Math.abs(totalBalance).toFixed(2);

  const isPositive = totalBalance > 0;
  const isSettledUp = Math.abs(totalBalance) < 0.01;

  if (isSettledUp && directBalance === 0 && groupBalances.every(g => g.balance === 0)) {
    return null;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Stop event propagation to prevent the Link from triggering
    e.preventDefault();
    e.stopPropagation();
  };

  const getFormattedDate = (): string => {
    const date = new Date();
    return date.toISOString().slice(0, 10);
  };

  const handleSettleFriend = async (
    type: string,
) => {
  
  const userId = Cookies.get('currentUserUid')||'';
  let transactions = await fetchTransactions(userId, friendId);
  
  const transactionsByExpense: { [expenseId: string]: Transaction[] } = {};
  transactions.forEach((t) => {
    if(!t.expense_id)t.expense_id= "direct-transfer"
    if (!transactionsByExpense[t.expense_id]) {
      transactionsByExpense[t.expense_id] = [];
    }
    transactionsByExpense[t.expense_id].push(t);
  });

  const balances: { expense_id: string; payer: string; receiver: string; amount: number; group_id: string }[] =
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
  }
  
  return balances;
};

  return (
    <Link href={`/friends/${friendId}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow w-full h-64">
        {/* Header Section - Fixed Height */}
        <div className="p-4 h-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 md:h-12 md:w-12">
                <AvatarImage src={image || '/default-avatar.jpg'} alt={name} />
                <AvatarFallback>{name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">{name}</h3>
                {!isSettledUp && (
                  <div className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center mt-1
                    ${isPositive ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}
                  >
                    {isPositive ? `Owes you RM ${formattedTotalAmount}`
                      : `You owe RM ${formattedTotalAmount}`}
                      
                  </div>
                )}
                {isSettledUp && (
                  <div className={'text-xs font-medium px-2 py-1 rounded-full inline-flex items-center mt-1 text-green-700 bg-green-50'}
                  >
                    Settled Up           
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-200 w-full"></div>

        {/* Balances Section - Scrollable if needed */}
        <div className="p-4 h-28 overflow-y-auto">
          <div className="space-y-2 text-sm text-gray-600">
            {directBalance !== 0 && (
              <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-5 h-5 flex items-center justify-center mr-2 text-indigo-500">👤</span>
                <span className="text-xs sm:text-sm">1:1</span>
              </div>
                <span className={`ml-1 ${directBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  RM {formattedDirectAmount}
                </span>
              </div>
            )}
            
            {groupBalances.map((group, index) => (
              group.balance !== 0 && (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-5 h-5 flex items-center justify-center mr-2">👥</span>
                    <span className="text-xs sm:text-sm">{group.name}</span>
                    </div>
                  <span className={`ml-1 ${group.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    RM {Math.abs(group.balance).toFixed(2)}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="h-px bg-gray-200 w-full"></div>

        {/* Footer Section - Now with Dialog */}
        <Dialog>
          <DialogTrigger asChild onClick={handleCardClick}>
            <div className="p-4 h-16 cursor-pointer hover:bg-gray-100 rounded-b-lg" onClick={()=>{if(window.confirm("Settle all the transation with this friend?"))handleSettleFriend(friendId)}}>
              <div className="flex">
                <button className="px-2.5 py-1.5 text-xs sm:text-sm">
                  Settle up
                </button>
                <div className="py-2">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settle up with {name}</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <div className="space-y-4">
                <div className="text-lg font-medium">
                  Total to settle: RM {formattedTotalAmount}
                </div>
                {/* Add your settle up form/content here */}
                <div className="space-y-2">
                  {directBalance !== 0 && (
                    <div className="flex justify-between">
                      <span>1:1 Balance</span>
                      <span>RM {formattedDirectAmount}</span>
                    </div>
                  )}
                  {groupBalances.map((group, index) => (
                    group.balance !== 0 && (
                      <div key={index} className="flex justify-between">
                        <span>{group.name}</span>
                        <span>RM {Math.abs(group.balance).toFixed(2)}</span>
                      </div>
                    )
                  ))}
                </div>
                <button 
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Record Settlement
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Link>
  );
}