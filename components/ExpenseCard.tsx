'use client'
import React from 'react';
import { Users, User, Check } from 'lucide-react';

interface ExpenseCardProps {
  name: string;
  amount: number;
  type: 'user' | 'group';
  memberCount?: number;
  avatarUrl?: string;
  groupType?: string;
  imageUrl?: string;  
}

const ExpenseCard = ({ 
  name, 
  amount, 
  type = 'user',
  memberCount,
  avatarUrl,
  groupType,
  imageUrl
}: ExpenseCardProps) => {
  const isPositive = amount >= 0;
  const isSettled = amount === 0;
  
  const displayImage = type === 'user' ? avatarUrl : imageUrl;
  
  return (
    <div className="w-full max-w-2xl p-3 bg-white rounded-lg shadow mb-2">
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                {type === 'group' ? (
                  <Users className="text-gray-600" size={24} />
                ) : (
                  <User className="text-gray-600" size={24} />
                )}
              </div>
            )}
          </div>
          
          {type === 'group' && groupType && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 whitespace-nowrap border border-gray-200">
              {groupType}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">{name}</h2>
            {type === 'group' && memberCount && (
              <span className="text-sm text-gray-500">
                • {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            )}
          </div>
          
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 mt-1.5 rounded-full text-sm font-medium
            ${isSettled 
              ? 'text-emerald-700 bg-emerald-50'
              : isPositive 
                ? 'text-green-700 bg-green-50' 
                : 'text-red-700 bg-red-50'
            }`}
          >
            {isSettled ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settled up</span>
              </>
            ) : (
              isPositive 
                ? `Owes you $${Math.abs(amount).toFixed(2)}`
                : `You owe $${Math.abs(amount).toFixed(2)}`
            )}
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-2.5 py-1.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm">
          New expense
        </button>
        

          <button className="px-2.5 py-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-sm">
            Settle up
          </button>
        
      </div>
    </div>
  );
};

export default ExpenseCard;