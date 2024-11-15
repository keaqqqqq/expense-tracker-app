import React from 'react';
import { ChevronDown, Users, User } from 'lucide-react';

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
  
  const displayImage = type === 'user' ? avatarUrl : imageUrl;
  
  return (
    <div className="w-full max-w-2xl p-3 bg-white rounded-lg shadow mb-2	">
      <div className="flex items-center gap-6 mb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
            {displayImage ? (
              <img 
                src={displayImage} 
                alt={name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                {type === 'group' ? (
                  <Users className="text-gray-600" size={32} />
                ) : (
                  <User className="text-gray-600" size={32} />
                )}
              </div>
            )}
          </div>
          
          {type === 'group' && groupType && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-600 whitespace-nowrap border border-gray-200">
              {groupType}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
            {type === 'group' && memberCount && (
              <span className="text-base text-gray-500">
                • {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </span>
            )}
          </div>
          
          <div className={`inline-block px-4 py-1.5 mt-2 rounded-full text-base font-medium
            ${isPositive 
              ? 'text-green-700 bg-green-50' 
              : 'text-red-700 bg-red-50'
            }`}
          >
            {isPositive 
              ? `You are owed $${Math.abs(amount).toFixed(2)}`
              : `You owe $${Math.abs(amount).toFixed(2)}`
            }
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button className="flex items-center gap-2 px-3 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm">
          New expense
        </button>
        
        <button className="px-3 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 text-sm">
          Settle up
        </button>
      </div>
    </div>
  );
};

export default ExpenseCard;