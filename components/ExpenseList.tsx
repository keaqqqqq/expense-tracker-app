'use client'
import React from 'react';
import { ChevronDown, Utensils, Edit2, DollarSign, User } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface Transaction {
  expense_id: string | null;
  payer_id: string;
  receiver_id: string;
  type: 'expense' | 'settle' | string;
  amount: number;
  group_id: string | null;
  created_at: string;
}

interface Splitter extends User {
  amount: number;
}

interface Expense {
  expense_id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
  created_by: string;
  group_id: string | null;
  date: string;
  payer: Splitter;
  split_preference: string;
  splitter: Splitter[];
}

interface GroupedTransactions {
  expense?: Expense;
  transactions: Transaction[];
}

interface ExpenseItemProps {
  groupedTransactions: GroupedTransactions;
  onEdit: (id: string) => void;
}

const ExpenseItem = ({ groupedTransactions, onEdit }: ExpenseItemProps) => {
  const { expense, transactions } = groupedTransactions;
  const isDirectPayment = !expense;

  // Find user data from the expense object based on email
  const getUserData = (email: string) => {
    return expense?.splitter.find(user => user.email === email);
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a.type === 'settle' && b.type !== 'settle') return -1;
    if (a.type !== 'settle' && b.type === 'settle') return 1;
    return 0;
  });

  return (
    <div className="w-full max-w-2xl">
      {/* Date header */}
      <div className="text-sm text-gray-500 mb-1 px-3">
        {expense?.date || transactions[0].created_at}
      </div>

      {/* Main content */}
      <div className="p-3 bg-white rounded-lg shadow">
        <div className="flex flex-col">
          {/* Main content container */}
          <div className="flex justify-between items-center">
            {/* Left section */}
            <div className="flex items-center gap-2">
              {!isDirectPayment ? (
                <>
                  <span className="text-gray-900 font-medium text-sm">{expense?.description}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <span>||</span>
                    <Utensils className="w-3 h-3" />
                    <span>{expense?.category}</span>
                  </div>
                </>
              ) : (
                <DollarSign className="w-4 h-4 text-gray-600" />
              )}
            </div>

            {/* Right section - Transactions and actions */}
            <div className="flex items-center gap-4">
              {/* Transactions container */}
              <div className="flex flex-col gap-2">
                {sortedTransactions.map((transaction) => {
                  const payerData = getUserData(transaction.payer_id);
                  const receiverData = getUserData(transaction.receiver_id);

                  return (
                    <div 
                      key={`${transaction.payer_id}-${transaction.created_at}`}
                      className="flex items-center gap-2"
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                        {payerData?.image ? (
                          <img 
                            src={payerData.image}
                            alt={payerData.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                        )}
                      </div>

                      <span className="text-gray-600 text-xs">
                        {transaction.type === 'settle' ? 'paid' : 'lent'}
                      </span>

                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                        {receiverData?.image ? (
                          <img 
                            src={receiverData.image}
                            alt={receiverData.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-500" />
                          </div>
                        )}
                      </div>

                      <span className="font-medium text-sm">
                        RM {transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Split count or payment icon */}
              {!isDirectPayment ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">=</span>
                  <span className="text-gray-500 text-xs">{expense?.splitter.length}</span>
                </div>
              ) : (
                <div className="bg-green-50 px-2 py-1 rounded-md">
                  <span className="text-green-700 text-xs">💵</span>
                </div>
              )}

              {/* Single edit button for the entire list */}
              <button 
                onClick={() => onEdit(expense?.expense_id || transactions[0].payer_id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const ExpenseList = () => {
  // Using the provided data
  const expenses: Expense[] = [
    {
      expense_id: "t1XpFvy1iINsQsyig95E",
      description: "Team Udon",
      amount: 30,
      category: "Food",
      created_at: "15/11/2024",
      created_by: "6gnTsoYDh9Or2f5vL7zgkrph1a33",
      group_id: null,
      date: "15/11/2024",
      payer: {
        amount: 30,
        email: "doraemon@gmail.com",
        id: "6gnTsoYDh9Or2f5vL7zgkrph1a33",
        name: "Doraemon",
        image: "https://firebasestorage.googleapis.com/v0/b/expense-tracker-app-480d4.appspot.com/o/profileImages%2F6gnTsoYDh9Or2f5vL7zgkrph1a33%2Fdownload%20(1).jpg?alt=media&token=1b2d3417-6310-49b4-a3f4-804d86859c9a"
      },
      split_preference: "",
      splitter: [
        {
          amount: 15,
          email: "doraemon@gmail.com",
          id: "6gnTsoYDh9Or2f5vL7zgkrph1a33",
          name: "Doraemon",
          image: "https://firebasestorage.googleapis.com/v0/b/expense-tracker-app-480d4.appspot.com/o/profileImages%2F6gnTsoYDh9Or2f5vL7zgkrph1a33%2Fdownload%20(1).jpg?alt=media&token=1b2d3417-6310-49b4-a3f4-804d86859c9a"
        },
        {
          amount: 15,
          email: "chua@gmail.com",
          id: "89OLkipUx6Qqnfj5afKd9DyW2hG3",
          name: "Chua",
          image: "https://firebasestorage.googleapis.com/v0/b/expense-tracker-app-480d4.appspot.com/o/profile_images%2F89OLkipUx6Qqnfj5afKd9DyW2hG3?alt=media&token=924148a3-0cd1-42aa-8ab9-25f11a628c8c"
        }
      ]
    }
  ];

  const transactions: Transaction[] = [
    {
      expense_id: "t1XpFvy1iINsQsyig95E",
      payer_id: "doraemon@gmail.com",
      receiver_id: "chua@gmail.com",
      type: "expense",
      amount: 15,
      group_id: null,
      created_at: "16/11/2024"
    },
    {
      expense_id: "t1XpFvy1iINsQsyig95E",
      payer_id: "chua@gmail.com",
      receiver_id: "doraemon@gmail.com",
      type: "settle",
      amount: 15,
      group_id: null,
      created_at: "16/11/2024"
    }
  ];

  // Group transactions by expense_id
  const groupedTransactions: GroupedTransactions[] = transactions.reduce((acc, transaction) => {
    const existingGroup = acc.find(group => 
      group.expense?.expense_id === transaction.expense_id
    );

    if (existingGroup) {
      existingGroup.transactions.push(transaction);
    } else {
      acc.push({
        expense: transaction.expense_id 
          ? expenses.find(e => e.expense_id === transaction.expense_id)
          : undefined,
        transactions: [transaction]
      });
    }

    return acc;
  }, [] as GroupedTransactions[]);

  return (
    <div className="space-y-1 divide-y">
      {groupedTransactions.map((group, index) => (
        <ExpenseItem 
          key={group.expense?.expense_id || `direct-payment-${index}`}
          groupedTransactions={group}
          onEdit={(id) => console.log('Edit:', id)}
        />
      ))}
    </div>
  );
};

export default ExpenseList;