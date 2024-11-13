import React from 'react';
import { ChevronDown } from 'lucide-react';

interface UserCardProps {
  name: string;
  amount: number;
}

const UserCard: React.FC<UserCardProps> = ({ name, amount }) => {
  return (
    <div className="max-w-md p-4 bg-white rounded-lg shadow">
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar placeholder - replace with actual avatar component if needed */}
        <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gray-300"/>
        </div>
        
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
          <div className="inline-block px-3 py-1 mt-1 text-red-700 bg-red-50 rounded-full text-sm">
            You owe ${amount.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          New expense
          <ChevronDown size={16} />
        </button>
        
        <button className="px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
          Settle up
        </button>
      </div>
    </div>
  );
};

export default UserCard;