'use client'
import React, { useState } from 'react';
import { Users, User, Check } from 'lucide-react';
import ExpenseModal from './ManageExpense/ExpenseModal';
import { useBalances } from '@/context/BalanceContext';
import TransactionModal from './Transaction/TransactionModal';
import Image from 'next/image';
import { useExpense } from '@/context/ExpenseContext';
import { useTransaction } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';

interface ExpenseCardProps {
  name: string;
  amount: number;
  type: 'user' | 'group';
  memberCount?: number;
  avatarUrl?: string;
  groupType?: string;
  imageUrl?: string;
  friendId?: string;
  groupId?: string; 
}

const ExpenseCard = ({ 
  name, 
  amount: initialAmount,
  type = 'user',
  memberCount,
  avatarUrl,
  groupType,
  imageUrl,
  friendId,
  groupId
}: ExpenseCardProps) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { calculateTotalBalance } = useBalances();
  const {setGroup} = useExpense();
  const {setTransaction} = useTransaction();
  const {currentUser} =useAuth();
  
  const rawDisplayAmount = type === 'user' && friendId ? calculateTotalBalance(friendId) : initialAmount;
  const ZERO_THRESHOLD = 1e-10;
  const displayAmount = Math.abs(rawDisplayAmount) < ZERO_THRESHOLD ? 0 : rawDisplayAmount;
  const isPositive = displayAmount >=1;
  const isSettled = displayAmount === 0;
  console.log(displayAmount)
  const displayImage = type === 'user' ? avatarUrl : imageUrl;
  
  const openExpenseModal = () => {
    if(type==='group' && groupId)setGroup(groupId);
    setIsExpenseModalOpen(true)
  };
  const closeExpenseModal = () => setIsExpenseModalOpen(false);
  
  const openTransactionModal = () => {
    if(type==='group' && groupId){
      setTransaction({
        payer_id: currentUser?.uid||'',
        receiver_id: "",
        expense_id:  null,
        amount: 0,
        created_at: '',
        group_id: groupId,
        id: '',
      })
    };
    if(type==='user' && friendId){
      setTransaction({
        payer_id: currentUser?.uid||'',
        receiver_id: friendId,
        expense_id: null,
        amount: 0,
        created_at: '',
        group_id:  null,
        id: '',
      })
    }
    setIsTransactionModalOpen(true)
  };
  const closeTransactionModal = async () => {
    setIsTransactionModalOpen(false);
  };
  
  return (
    <>
      <div className="w-full max-w-7xl p-2 sm:p-3 bg-white rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          {/* Left side - Avatar and Info */}
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full overflow-hidden">
                {displayImage ? (
                  <Image
                    unoptimized
                    src={displayImage} 
                    alt={name} 
                    className="w-full h-full object-cover"
                    width={100}
                    height={100}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    {type === 'group' ? (
                      <Users className="text-gray-600 w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <User className="text-gray-600 w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </div>
                )}
              </div>
              
              {type === 'group' && groupType && (
                <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 px-1.5 sm:px-2 py-0.5 bg-gray-100 rounded-full text-[10px] sm:text-xs text-gray-600 whitespace-nowrap border border-gray-200">
                  {groupType}
                </div>
              )}
            </div>
            
            {/* Name and Status */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                  {name}
                </h2>
                {type === 'group' && memberCount && (
                  <span className="text-xs sm:text-sm text-gray-500">
                    • {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                )}
              </div>
              
              <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 mt-1.5 rounded-full text-xs sm:text-sm font-medium
                ${isSettled 
                  ? 'text-emerald-700 bg-emerald-50'
                  : isPositive 
                    ? 'text-green-700 bg-green-50' 
                    : 'text-red-700 bg-red-50'
                }`}
              >
                {isSettled ? (
                  <>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Settled up</span>
                  </>
                ) : (
                  isPositive 
                    ? `Owes you RM${Math.abs(displayAmount).toFixed(2)}`
                    : `You owe RM${Math.abs(displayAmount).toFixed(2)}`
                )}
              </div>
            </div>
          </div>

          {/* Right side - Buttons */}
          <div className="flex gap-2 sm:gap-3 ml-auto sm:ml-0 mt-2 sm:mt-0 flex-wrap">
            <button 
              onClick={openExpenseModal}
              className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap"
            >
              New expense
            </button>
            
              <button 
                onClick={openTransactionModal}
                className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap"
              >
                Settle up
              </button>
          </div>
        </div>
      </div>

      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        closeModal={closeExpenseModal}
        friendId={friendId}
        groupId={groupId}
        refreshAll={false}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        closeModal={closeTransactionModal}
      />
    </>
  );
};

export default ExpenseCard;