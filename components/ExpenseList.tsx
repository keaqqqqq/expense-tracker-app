'use client'
import React, { useState, useMemo } from 'react';
import { ChevronDown, Utensils, Edit2, DollarSign, User, Receipt } from 'lucide-react';
import type { GroupedTransactions} from '@/types/ExpenseList';
import { useExpenseList } from '@/context/ExpenseListContext';
import { Expense } from '@/types/Expense';
import { Transaction } from '@/types/Transaction';
interface ExpenseItemProps {
  groupedTransactions: GroupedTransactions;
  onEdit: (id: string) => void;
  currentUserId: string;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ groupedTransactions, onEdit, currentUserId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { expense, transactions } = groupedTransactions;
  const isDirectPayment = transactions[0]?.expense_id === 'direct-payment';
  const { usersData } = useExpenseList();
  const isPersonalExpense = expense?.splitter.length === 0;
  const getUserData = (userId: string) => {
    if (isDirectPayment || expense?.splitter || expense?.payer ) {
      return usersData[userId];
    }
    return undefined;
  };
  console.log('Expense: ' + JSON.stringify(expense))
  const getDisplayName = (userId: string) => {
    return userId === currentUserId ? 'You' : getUserData(userId)?.name || userId;
  };

  console.log('Expense: ' + expense)
  const calculateSummary = () => {
    if (isDirectPayment) {
      const transaction = transactions[0];
      return {
        totalAmount: transaction.amount,
        perPersonAmount: transaction.amount,
        participants: [
          {
            id: transaction.payer_id,
            name: getDisplayName(transaction.payer_id),
            paid: transaction.amount,
            owed: 0,
            balance: transaction.amount
          },
          {
            id: transaction.receiver_id,
            name: getDisplayName(transaction.receiver_id),
            paid: 0,
            owed: transaction.amount,
            balance: -transaction.amount
          }
        ]
      };
    }

    const totalAmount = expense?.amount || 0;
    
    const allUsers = new Set<string>();
    
    expense?.payer?.forEach(user => allUsers.add(user.id));
    
    expense?.splitter?.forEach(user => allUsers.add(user.id));

    const participants = Array.from(allUsers).map(userId => {
      const paidAmount = expense?.payer?.find(p => p.id === userId)?.amount || 0;

      const owedAmount = expense?.splitter?.find(s => s.id === userId)?.amount || 0;

      const balance = paidAmount - owedAmount;

      return {
        id: userId,
        name: getDisplayName(userId),
        paid: paidAmount,
        owed: owedAmount,
        balance: balance
      };
    });

    return {
      totalAmount,
      participants: participants.sort((a, b) => a.name.localeCompare(b.name))
    };
  };


  const sortedTransactions = [...transactions].sort((a, b) => {
    const getPriority = (type: string) => {
      if (type === 'expense') return 0;  
      if (type === 'settle') return 2;   
      return 1;  
    };

    const priorityA = getPriority(a.type || '');
    const priorityB = getPriority(b.type || '');
    
    return priorityA - priorityB;
  });

  const getLentDisplayText = (transaction: Transaction) => {
    const samePayerTransactions = transactions.filter(t => 
      t.type === 'expense' && t.payer_id === transaction.payer_id
    );
    
    if (samePayerTransactions.length > 1) {
      const isCurrentUserReceiver = samePayerTransactions.some(t => t.receiver_id === currentUserId);
      const otherPeopleCount = samePayerTransactions.length - (isCurrentUserReceiver ? 1 : 0);
      
      if (isCurrentUserReceiver) {
        if (otherPeopleCount === 0) {
          return 'lent you';
        }
        return `lent you and ${otherPeopleCount} other${otherPeopleCount > 1 ? 's' : ''}`;
      }
      return `lent ${samePayerTransactions.length} people`;
    }
    return 'lent';
  };

  const getPayersDisplay = (expense: Expense) => {
    if (!expense?.payer) return null;
    return (
      <div className="flex items-center gap-2">
        {expense.payer.map((payer, index) => {
          const userData = getUserData(payer.id);
          return (
            <React.Fragment key={payer.id}>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                  {userData?.image ? (
                    <img src={userData.image} alt={userData.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600">
                  {payer.id === currentUserId ? 'You' : userData?.name || payer.id}
                </span>
              </div>
              {index < expense.payer.length - 1 && (
                <span className="text-gray-400">,</span>
              )}
            </React.Fragment>
          );
        })}
        <span className="text-gray-400 text-xs">paid</span>
        <span className="text-xs text-gray-600">
          RM {expense.amount}
        </span>
      </div>
    );
  };

  const summary = calculateSummary();

  const isSettled = () => {
    if (isDirectPayment) return true;
    if (isPersonalExpense) return true;
  
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const settleTransactions = transactions.filter(t => t.type === 'settle');
  
    const borrowers = new Set(expenseTransactions.map(t => t.receiver_id));
    
    return Array.from(borrowers).every(borrowerId => {
      const borrowedAmount = expenseTransactions
        .filter(t => t.receiver_id === borrowerId)
        .reduce((sum, t) => sum + t.amount, 0);
  
      const paidAmount = settleTransactions
        .filter(t => t.payer_id === borrowerId)
        .reduce((sum, t) => sum + t.amount, 0);
  
      return Math.abs(paidAmount - borrowedAmount) < 0.01;
    });
  };
  return (
    <div className="w-full max-w-7xl">
    <div className="text-sm text-gray-500 mb-1 px-3 flex justify-between items-center">
      <span>
        {expense?.date 
          ? new Date(expense.date).toLocaleDateString('en-GB')
          : new Date(transactions[0].created_at).toLocaleDateString('en-GB')}
      </span>
      {!isDirectPayment && !isPersonalExpense && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSettled() ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-xs">
            {isSettled() ? 'Settled' : 'Unsettled'}
          </span>
        </div>
      )}
    </div>

    <div className={`bg-white rounded-lg shadow ${
      isDirectPayment 
      ? 'border-l-4 border-indigo-600' 
      : isPersonalExpense
        ? 'border-l-4 border-yellow-400'
        : isSettled()
          ? 'border-l-4 border-green-400'
          : 'border-l-4 border-red-400'
    }`}>
        <div className="p-3">
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
          {isDirectPayment ? (
            <>
              <DollarSign className="w-3 h-3" />
              <span>Direct Payment</span>
            </>
          ) : (
            <>
              <Receipt className="w-3 h-3" />
              <span>{isPersonalExpense ? 'Personal Expense' : 'Expense with Split'}</span>
            </>
          )}
        </div>

          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
                <span className="text-gray-900 font-medium text-sm">
                  {isDirectPayment ? 'Transfer' : expense?.description}
                </span>
              </button>

              {!isDirectPayment && (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md">
                    <Utensils className="w-3 h-3" />
                    <span>{expense?.category}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <span className="font-medium text-sm">
                RM {summary.totalAmount}
              </span>
              <button 
                onClick={() => onEdit(expense?.id || transactions[0].payer_id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4">

              <div className="space-y-3">
                {!isDirectPayment && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Total payment</span>
                      <div className="flex-1 border-b border-dashed border-gray-200"></div>
                    </div>
                    {getPayersDisplay(expense!)}
                  </div>
                )}

                {!isDirectPayment && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      {sortedTransactions
                        .filter(t => t.type === 'expense')
                        .map((transaction, index) => {
                          const payerData = getUserData(transaction.payer_id);
                          const receiverData = getUserData(transaction.receiver_id);
                          const samePayerTransactions = transactions.filter(t => 
                            t.type === 'expense' && t.payer_id === transaction.payer_id
                          );
                          const isMultipleLent = samePayerTransactions.length > 1;

                          if (isMultipleLent && samePayerTransactions[0] !== transaction) {
                            return null;
                          }

                          return (
                            <div key={`${transaction.payer_id}-${transaction.created_at}`}>
                              {index === 0 && (
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>Your lending</span>
                                  <div className="flex-1 border-b border-dashed border-gray-200"></div>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5">
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
                                  <span className="text-xs text-gray-600">
                                    {getDisplayName(transaction.payer_id)}
                                  </span>
                                </div>

                                <span className="text-gray-400 text-xs">
                                  {getLentDisplayText(transaction)}
                                </span>

                                {!isMultipleLent && (
                                  <div className="flex items-center gap-1.5">
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
                                    <span className="text-xs text-gray-600">
                                      {getDisplayName(transaction.receiver_id)}
                                    </span>
                                  </div>
                                )}

                                <span className="text-xs text-gray-600">
                                RM {isMultipleLent ? 
                                    samePayerTransactions.reduce((sum, t) => sum + t.amount, 0) : 
                                    transaction.amount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                        {sortedTransactions.filter(t => t.type === 'settle').length > 0 && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>Settlements</span>
                              <div className="flex-1 border-b border-dashed border-gray-200">
                              </div>
                            </div>
                            {sortedTransactions
                              .filter(t => t.type === 'settle')
                              .map(transaction => {
                                const payerData = getUserData(transaction.payer_id);
                                const receiverData = getUserData(transaction.receiver_id);
                                return (
                                  <div 
                                    key={`${transaction.payer_id}-${transaction.created_at}`}
                                    className="flex items-center justify-between w-full"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1.5">
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
                                        <span className="text-xs text-gray-600">
                                          {getDisplayName(transaction.payer_id)}
                                        </span>
                                      </div>

                                      <span className="text-gray-400 text-xs">paid</span>

                                      <div className="flex items-center gap-1.5">
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
                                        <span className="text-xs text-gray-600">
                                          {getDisplayName(transaction.receiver_id)}
                                        </span>
                                      </div>

                                      <span className="text-xs text-gray-600">
                                        RM {transaction.amount}
                                      </span>
                                    </div>

                                    <span className="text-xs text-gray-400 ml-auto">
                                      {new Date(transaction.created_at).toLocaleDateString('en-GB')}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                  </div>
                )}

                  {isDirectPayment && sortedTransactions.map(transaction => {
                  const payerData = getUserData(transaction.payer_id);
                  const receiverData = getUserData(transaction.receiver_id);
                  return (
                    <div 
                      key={`${transaction.payer_id}-${transaction.created_at}`}
                      className="flex items-center gap-2"
                    >
                      <div className="flex items-center gap-1.5">
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
                        <span className="text-xs text-gray-600">
                          {getDisplayName(transaction.payer_id)}
                        </span>
                      </div>

                      <span className="text-gray-400 text-xs">paid</span>

                      <div className="flex items-center gap-1.5">
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
                        <span className="text-xs text-gray-600">
                          {getDisplayName(transaction.receiver_id)}
                        </span>
                      </div>

                      <span className="font-medium text-sm text-gray-900">
                        RM {transaction.amount}
                      </span>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Split Summary</span>
                  <div className="flex-1 border-b border-dashed border-gray-200">
                </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="col-span-1 text-xs text-gray-400">Users</div>
                  <div className="text-right text-xs text-gray-400">Paid</div>
                  <div className="text-right text-xs text-gray-400">Owed</div>
                  <div className="text-right text-xs text-gray-400">Balance</div>
                  
                  {summary.participants.map(participant => (
                    <React.Fragment key={participant.id}>
                      <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                      {getUserData(participant.id)?.image ? (
                            <img 
                              src={getUserData(participant.id)?.image} 
                              alt={participant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600">{participant.name}</span>
                      </div>
                      <span className="text-xs text-gray-600 text-right">
                        RM {participant.paid}
                      </span>
                      <span className="text-xs text-gray-600 text-right">
                        RM {participant.owed}
                      </span>
                      <span className={`text-xs text-gray-600 text-right ${
                        participant.balance > 0 
                          ? 'text-green-600' 
                          : participant.balance < 0 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                      }`}>
                        {participant.balance > 0 ? '+' : ''}
                        RM {participant.balance.toFixed(2)}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>


              </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExpenseList: React.FC<{ currentUserId: string; showAll?: boolean }> = ({ currentUserId, showAll = false }) => {
  const { groupTransactions, groupedTransactions } = useExpenseList();
  
  const transactions = useMemo(() => {
    if (!showAll) {
      return groupTransactions?.length > 0 ? groupTransactions : groupedTransactions;
    }
    
    return [...(groupedTransactions || []), ...(groupTransactions || [])]
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = new Date(a.expense?.created_at || a.transactions[0]?.created_at).getTime();
        const dateB = new Date(b.expense?.created_at || b.transactions[0]?.created_at).getTime();
        return dateB - dateA; 
      });
  }, [showAll, groupTransactions, groupedTransactions]);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="mt-4">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow w-full max-w-7xl">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                No Transactions Yet
              </h3>
              <p className="text-xs text-gray-500 max-w-sm">
                {showAll 
                  ? "You don't have any expenses yet. Create a new expense to start tracking your spending!"
                  : groupTransactions?.length >= 0 
                    ? "This group doesn't have any expenses yet. Create a new expense to start tracking group spending!"
                    : "You haven't shared any expenses yet. Create a new expense to start tracking your spending!"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="space-y-4">
        {transactions.map((group: GroupedTransactions, index: number) => (
          <ExpenseItem 
            key={group.expense?.id || `payment-${index}`}
            groupedTransactions={group}
            currentUserId={currentUserId}
            onEdit={(id: string) => console.log('Edit:', id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ExpenseList;