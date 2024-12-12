'use client'
import React, { useState, useMemo } from 'react';
import { ChevronDown, Edit2, DollarSign, User, Receipt, Users} from 'lucide-react';
import type { GroupedTransactions } from '@/types/ExpenseList';
import { useExpenseList } from '@/context/ExpenseListContext';
import { Expense } from '@/types/Expense';
import { Transaction } from '@/types/Transaction';
import ExpenseCategoryDisplay
  from './ExpenseCategoryDisplay';
import Image from 'next/image';
import { useExpense } from '@/context/ExpenseContext';
import ExpenseModal from './ManageExpense/ExpenseModal';
import TransactionModal from './Transaction/TransactionModal';
import { useTransaction } from '@/context/TransactionContext';
import { getUserFCMToken } from '@/lib/actions/notifications';
import { getDoc, doc} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { sendNotification } from '@/lib/actions/notifications';
interface ExpenseItemProps {
  groupedTransactions: GroupedTransactions;
  onEdit: (id: string) => void;
  currentUserId: string;
  allExpense?: boolean;
  groupName?: string;
  fromPage: 'expense' | 'friend' | 'group';
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ groupedTransactions, onEdit, currentUserId, allExpense, groupName, fromPage  }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen]= useState(false);
  const { expense, transactions } = groupedTransactions;
  const isDirectPayment = transactions[0]?.expense_id === 'direct-payment';
  const { usersData } = useExpenseList();
  const isPersonalExpense = expense?.payer[0].id == expense?.splitter[0].id && expense?.amount == expense?.splitter[0].amount && expense?.payer.length == 1
  const {setTransaction} = useTransaction();
  async function getExpenseDescription(expenseId: string): Promise<string> {
    if (!expenseId || expenseId === "direct-transfer") return "(direct-payment)";
    
    const expenseDoc = await getDoc(doc(db, 'Expenses', expenseId));
    return expenseDoc.exists() ? expenseDoc.data().description : "(direct-payment)";
}

  const onSettle = async (receiverId: string, payerId:string, expense: Expense|undefined, amount: number) => {
    setTransaction({
      payer_id: payerId,
      receiver_id: receiverId,
      expense_id: expense?.id || null,
      amount: amount,
      created_at: '',
      group_id: expense?.group_id || null,
      id: '',
    })
    const receiverToken = await getUserFCMToken(receiverId);
    const payerDoc = await getDoc(doc(db, 'Users', payerId));
    const payerData = payerDoc.data();
    if (receiverToken) {
      const notificationType = `EXPENSE_SETTLED_${payerId}_${receiverId}_${Math.floor(Date.now() / 1000)}`;
      if(!expense?.id){
        return null;
      }
      console.log('Notification type: ' + notificationType)
      const expenseDescription = await getExpenseDescription(expense?.id);

      const notificationData = {
          title: 'Payment Settled',
          body: `${payerData?.name || 'Someone'} settled a payment${expenseDescription ? ` for ${expenseDescription}` : ''}: RM${amount}`,
          url: expense.group_id ? `/groups/${expense.group_id}` : `/friends/${payerId}`,
          type: notificationType,
          image: payerData?.image || ''
      };
      console.log('Sending notification:', notificationData);

      await sendNotification(receiverToken, notificationType, notificationData);
      console.log('Notification sent successfully');
    } else {
        console.log('No receiver token found for:', payerId);
    }
  }

  const getUserData = (userId: string) => {
    if (isDirectPayment || expense?.splitter || expense?.payer) {
      return usersData[userId];
    }
    return undefined;
  };
  const getDisplayName = (userId: string) => {
    return userId === currentUserId ? 'You' : getUserData(userId)?.name || userId;
  };

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
    const getPriority = (transaction: Transaction) => {
      // If it's a direct payment (can be identified by expense_id)
      if (transaction.expense_id === 'direct-payment') return 2;
      // For settlement transactions
      if (transaction.type === 'settle') return 1;
      // For expense transactions (highest priority)
      if (transaction.type === 'expense') return 0;
      // Default case
      return 3;
    };
  
    const priorityA = getPriority(a);
    const priorityB = getPriority(b);
  
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
                    <Image src={userData.image} alt={userData.name || 'User image'} className="w-full h-full object-cover" unoptimized width={100} height={100} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600 hidden sm:block">
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

  const getBalancesDisplay = (transactions: Transaction[]) => {
    // Calculate balances
    const balances = (() => {
      const balanceMap = new Map<string, number>();

      transactions.forEach(({ payer_id, receiver_id, amount }) => {
        const key = `${payer_id}->${receiver_id}`;
        const reverseKey = `${receiver_id}->${payer_id}`;

        if (balanceMap.has(reverseKey)) {
          const reverseAmount = balanceMap.get(reverseKey)!;
          if (reverseAmount > amount) {
            balanceMap.set(reverseKey, reverseAmount - amount);
          } else if (reverseAmount < amount) {
            balanceMap.delete(reverseKey);
            balanceMap.set(key, amount - reverseAmount);
          } else {
            balanceMap.delete(reverseKey);
          }
        } else {
          balanceMap.set(key, (balanceMap.get(key) || 0) + amount);
        }
      });

      return Array.from(balanceMap.entries()).map(([key, amount]) => {
        const [payer_id, receiver_id] = key.split('->');
        return { payer_id, receiver_id, amount };
      });
    })();

    // Display balances
    if (!balances.length) return null;
    if(isDirectPayment) return null;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Your balance</span>
          <div className="flex-1 border-b border-dashed border-gray-200"></div>
        </div>
        {balances.map(({ payer_id, receiver_id, amount }, index) => {
          const payerData = getUserData(payer_id);
          const receiverData = getUserData(receiver_id);

          return (
            <div key={index} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                  {receiverData?.image ? (
                    <Image
                      src={receiverData.image}
                      alt={receiverData.name || 'Payer image'}
                      className="w-full h-full object-cover"
                      unoptimized
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600 hidden sm:block">
                  {getDisplayName(receiver_id)}
                </span>
              </div>
              <span className="text-gray-400 text-xs">owes</span>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                  {payerData?.image ? (
                    <Image
                      src={payerData.image}
                      alt={payerData.name || 'payer image'}
                      className="w-full h-full object-cover"
                      unoptimized
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-600 hidden sm:block">
                  {getDisplayName(payer_id)}
                </span>
              </div>
              <span className="text-xs text-gray-600">RM {amount.toFixed(2)}</span>
              <a className='text-gray-300 text-xs hover:text-indigo-500' onClick={()=>{onSettle(payer_id, receiver_id, expense, amount);setIsTransactionModalOpen(true)}}>settle</a>
            </div>
          );
        })}
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
    <div className="w-full max-w-10xl">
       <TransactionModal 
      isOpen={isTransactionModalOpen}
      closeModal={()=> setIsTransactionModalOpen(false)}
      fromPage={fromPage}
      />
      <div className="text-sm text-gray-500 mb-1 px-3 flex justify-between items-center">
        <span>
        {(expense?.date || transactions[0]?.created_at)?.split('-').reverse().join('/')}
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

      <div className={`bg-white rounded-lg shadow ${isDirectPayment
          ? 'border-l-4 border-indigo-600'
          : isPersonalExpense
            ? 'border-l-4 border-yellow-400'
            : isSettled()
              ? 'border-l-4 border-green-400'
              : 'border-l-4 border-red-400'
        }`}>
        <div className="p-3 mb-10 sm:mb-0">
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            {isDirectPayment ? (
              <>
                <DollarSign className="w-3 h-3" />
                <span>Direct Payment</span>
              </>
            ) : (
              <>
                <Receipt className="w-3 h-3" />
                <span className='text-xs'>{isPersonalExpense ? 'Personal Expense' : 'Expense with Split'}</span>
              </>
            )}
          </div>

          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <span className="text-gray-900 font-medium text-xs sm:text-sm">
                  {isDirectPayment ? 'Transfer' : expense?.description}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {!isDirectPayment && expense?.category && (
                <div className="flex items-center text-gray-500">
                  <div className="flex items-center py-0.5 ">
                    <ExpenseCategoryDisplay value={expense.category} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-medium text-sm sm: text-xs">
                RM {summary.totalAmount}
              </span>
              <button
                onClick={() => onEdit(expense?.id || transactions[0].payer_id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {allExpense && (expense?.group_id || (isDirectPayment && transactions[0]?.group_id)) && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
              <Users className="w-3 h-3" />
              <span className='text-xs'>{groupName}</span>
            </div>
          )}

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
                                      <Image
                                        src={payerData.image}
                                        alt={payerData.name || 'User image'}
                                        className="w-full h-full object-cover"
                                        width={100}
                                        height={100}
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-gray-500" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-600 hidden sm:block">
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
                                        <Image
                                          src={receiverData.image}
                                          alt={receiverData.name || 'User image'}
                                          className="w-full h-full object-cover"
                                          width={100}
                                          height={100}
                                          unoptimized
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <User className="w-3 h-3 text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-600 hidden sm:block">
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
                                        <Image
                                          src={payerData.image}
                                          alt={payerData.name || 'User image'}
                                          className="w-full h-full object-cover"
                                          unoptimized
                                          width={100}
                                          height={100}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <User className="w-3 h-3 text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-600 hidden sm:block">
                                      {getDisplayName(transaction.payer_id)}
                                    </span>
                                  </div>

                                  <span className="text-gray-400 text-xs">paid</span>

                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                                      {receiverData?.image ? (
                                        <Image
                                          src={receiverData.image}
                                          alt={receiverData.name || 'User image'}
                                          className="w-full h-full object-cover"
                                          unoptimized
                                          width={100}
                                          height={100}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <User className="w-3 h-3 text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-600 hidden sm:block">
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
                            <Image
                              src={payerData.image}
                              alt={payerData.name || 'User image'}
                              className="w-full h-full object-cover"
                              unoptimized
                              width={100}
                              height={100}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 hidden sm:block">
                          {getDisplayName(transaction.payer_id)}
                        </span>
                      </div>

                      <span className="text-gray-400 text-xs">paid</span>

                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                          {receiverData?.image ? (
                            <Image
                              src={receiverData.image}
                              alt={receiverData.name || 'User image'}
                              className="w-full h-full object-cover"
                              unoptimized
                              width={100}
                              height={100}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-600 hidden sm:block">
                          {getDisplayName(transaction.receiver_id)}
                        </span>
                      </div>

                      <span className="font-medium text-sm text-gray-900">
                        RM {transaction.amount}
                      </span>
                    </div>
                  );
                })}
                {getBalancesDisplay(transactions)}

                {!isDirectPayment && (
                  <>
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
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 relative">
                              {getUserData(participant.id)?.image ? (
                                <Image
                                  src={getUserData(participant.id)?.image || '/default-avatar.jpg'}
                                  alt={participant.name}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                  width={100}
                                  height={100}
                                />
                              ) : (
                                <User className="w-3 h-3 text-gray-500" />
                              )}
                            </div>
                            <span className="hidden sm:block text-gray-600 sm:text-xs">{participant.name}</span>
                          </div>
                          <span className="text-xs text-gray-600 text-right">
                            RM {participant.paid}
                          </span>
                          <span className="text-xs text-gray-600 text-right">
                            RM {participant.owed}
                          </span>
                          <span className={`text-xs text-gray-600 text-right ${participant.balance > 0
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
                  </>
                )}
              </div>


            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExpenseList: React.FC<{ currentUserId: string; showAll?: boolean; allExpense?: boolean;  fromPage: 'expense' | 'friend' | 'group'; }> = ({ currentUserId, showAll = false, allExpense = false, fromPage }) => {
  const { groupTransactions, groupedTransactions, groupDetails } = useExpenseList();
  const { setExpenseById } = useExpense();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'settled' | 'unsettled' | 'direct-payment'>('all');

  const handleEditExpense = (id: string) => {
    setExpenseById(id);
    setIsExpenseModalOpen(true);
  };

  const isExpenseSettled = (group: GroupedTransactions) => {
    
    const expense = group.expense;
    if (!expense?.payer || !expense?.splitter) return false;
    
    // Check if it's a personal expense
    if (expense.payer.length === 1 && 
        expense.payer[0].id === expense.splitter[0].id && 
        expense.amount === expense.splitter[0].amount) {
      return true;
    }

    const expenseTransactions = group.transactions.filter(t => t.type === 'expense');
    const settleTransactions = group.transactions.filter(t => t.type === 'settle');
    
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

  const filteredTransactions = useMemo(() => {
    let transactions = showAll
      ? [...(groupedTransactions || []), ...(groupTransactions || [])]
      : groupTransactions?.length > 0 
        ? groupTransactions 
        : groupedTransactions;
  
    if (!transactions) return [];
  
    transactions = transactions.filter(Boolean).sort((a, b) => {
      const getPriority = (group: GroupedTransactions) => {
        if (group.transactions[0]?.expense_id === 'direct-payment') return 1;
        
        const isSettled = (() => {
          const expense = group.expense;
          if (!expense?.payer || !expense?.splitter) return true;
          
          if (expense.payer.length === 1 && 
              expense.payer[0].id === expense.splitter[0].id && 
              expense.amount === expense.splitter[0].amount) {
            return true;
          }
  
          const expenseTransactions = group.transactions.filter(t => t.type === 'expense');
          const settleTransactions = group.transactions.filter(t => t.type === 'settle');
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
        })();
  
        if (!isSettled) return 0;
        return 2;
      };
  
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
  
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
  
      const dateA = new Date(a.expense?.date || a.transactions[0]?.created_at).getTime();
      const dateB = new Date(b.expense?.date || b.transactions[0]?.created_at).getTime();
      return dateB - dateA;
    });
  
    switch (filterType) {
      case 'settled':
        return transactions.filter(group => {
          const isDirectPayment = group.transactions[0]?.expense_id === 'direct-payment';
          return !isDirectPayment && isExpenseSettled(group);
        });
      case 'unsettled':
        return transactions.filter(group => {
          const isDirectPayment = group.transactions[0]?.expense_id === 'direct-payment';
          return !isDirectPayment && !isExpenseSettled(group);
        });
      case 'direct-payment':
        return transactions.filter(group => group.transactions[0]?.expense_id === 'direct-payment');
      default:
        return transactions;
    }
  }, [showAll, groupTransactions, groupedTransactions, filterType]);

  if (!filteredTransactions || filteredTransactions.length === 0) {
    return (
      <div className="mt-4 mb-5">
        <div className="flex justify-end mb-4">
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="text-sm border-none bg-transparent focus:outline-none text-gray-600"
            >
              <option value="all">All Expenses</option>
              <option value="settled">Settled</option>
              <option value="unsettled">Unsettled</option>
              <option value="direct-payment">Direct Payment</option>
            </select>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow w-full max-w-7xl">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                No Transactions Found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm">
                No expenses match your current filter criteria. Try changing the filter or create new expenses.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-end mb-4">
        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="text-xs border-none bg-transparent focus:outline-none text-gray-600"
          >
            <option value="all">All Expenses</option>
            <option value="settled">Settled</option>
            <option value="unsettled">Unsettled</option>
            <option value="direct-payment">Direct Payment</option>
          </select>
        </div>
      </div>
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        closeModal={() => setIsExpenseModalOpen(false)}
        refreshAll={false}
      />
      <div className="space-y-4">
        {filteredTransactions.map((group: GroupedTransactions, index: number) => (
          <ExpenseItem
            key={group.expense?.id || `payment-${index}`}
            groupedTransactions={group}
            currentUserId={currentUserId}
            onEdit={() => handleEditExpense(group.expense?.id || "")}
            allExpense={allExpense}
            fromPage={fromPage}
            groupName={
              (group.expense?.group_id && groupDetails && groupDetails[group.expense.group_id]) || 
              (!group.expense && group.transactions[0]?.group_id && groupDetails && groupDetails[group.transactions[0].group_id]) ||
              undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

export default ExpenseList;