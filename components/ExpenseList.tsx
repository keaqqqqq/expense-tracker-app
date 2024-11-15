'use client'
import React from 'react';
import { ChevronDown, Utensils, Edit2 } from 'lucide-react';

interface ExpenseItemProps {
  id: string;
  date: string;
  category: 'Restaurant' | 'Dinner' | string;
  amount: number;
  currency?: string;
  paidBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  paidFor: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  split?: number;
  status?: string;
  onEdit?: (id: string) => void;
}

const ExpenseItem = ({
  date,
  category,
  amount,
  currency = '$',
  paidBy,
  paidFor,
  split,
  status,
  onEdit,
  id,
}: ExpenseItemProps) => {
  return (
    <div className="w-full max-w-2xl p-3 bg-white rounded-lg shadow">
      {/* Date header */}
      <div className="text-sm font-medium text-gray-600">
        {date}
      </div>
      
      {/* Main expense card */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left section - Category and title */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Utensils className="w-5 h-5 text-gray-600" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-sm text-gray-600">
                {status || 'Not involved'}
              </div>
            </div>
          </div>
          
          {/* Right section - Split and edit */}
          <div className="flex items-center gap-4">
            {split && (
              <div className="text-gray-500">
                = {split}
              </div>
            )}
            
            <button 
              onClick={() => onEdit?.(id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payment details footer */}
        <div className="mt-3 flex items-center gap-3 text-sm">
          <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
            {paidBy.avatarUrl && (
              <img 
                src={paidBy.avatarUrl} 
                alt={paidBy.name} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <span className="text-gray-400">→</span>
          
          <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
            {paidFor.avatarUrl && (
              <img 
                src={paidFor.avatarUrl} 
                alt={paidFor.name} 
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <span className="font-medium text-gray-900">
            {currency}{amount.toFixed(2)}
          </span>
          
          {/* Conditional payment indicator */}
          <div className="ml-2">
            <div className="bg-green-50 px-2 py-1 rounded-md">
              <span className="text-green-700">💵</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage wrapper component
const ExpenseList = () => {
  const expenses = [
    {
      id: '1',
      date: 'NOV 6, 2024 · 8',
      category: 'Dinner',
      amount: 32.00,
      paidBy: {
        id: 'cb',
        name: 'CB',
      },
      paidFor: {
        id: 'user',
        name: 'You',
      },
      split: 2,
      status: 'Not involved',
    },
    {
      id: '2',
      date: 'NOV 6, 2024 · 8',
      category: 'Dinner',
      amount: 33.34,
      currency: '$',
      paidBy: {
        id: 'user',
        name: 'You',
      },
      paidFor: {
        id: 'cb',
        name: 'CB',
      },
    },
  ];

  return (
    <div className="space-y-6">
      {expenses.map((expense) => (
        <ExpenseItem 
          key={expense.id}
          {...expense}
          onEdit={(id) => console.log('Edit expense:', id)}
        />
      ))}
    </div>
  );
};

export default ExpenseList;