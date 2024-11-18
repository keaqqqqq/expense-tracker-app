// DisplayPayer.tsx
import React, { useState } from 'react';
import { useExpense } from '@/context/ExpenseContext';
import { SplitFriend } from '@/types/SplitFriend';

interface DisplayPayerProps {

}

const DisplayPayer: React.FC<DisplayPayerProps> = ({}) => {
//   const { expense, userData } = useExpense();
  const { friendList, expense, addPayer } = useExpense();
  const [selectedFriend, setSelectedFriend] = useState<Omit<SplitFriend, 'amount'> | null>(null);


  // Handle when a user selects a friend to add to the split
  const handleSelectFriend = (friend: Omit<SplitFriend, 'amount'>) => {
    if (!expense.payer.some(f => f.id === friend.id)) {
      addPayer(friend);
      setSelectedFriend(null); // Clear the selected friend
    }
  };
  
  return (
    <div className="flex flex-col w-full my-2">
      <select
        id="friend"
        value={selectedFriend?.id || ''}
        onChange={(e) => {
          const friend = friendList.find(f => f.id === e.target.value);
          if (friend) {
            setSelectedFriend(friend);
            handleSelectFriend(friend);
          }
        }}
        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      >
        <option value="" disabled>Select a friend</option>
        {friendList
          .filter(friend => !expense.payer.some(f => f.id === friend.id)) // Exclude already added expense.payer
          .map(friend => (
            <option key={friend.id} value={friend.id}>
              {friend.name}
            </option>
          ))}
      </select>
      {selectedFriend && (
        <p className="mt-2 text-green-600">
          {selectedFriend.name} has been added to the split!
        </p>
      )}
    </div>
  );
};

export default DisplayPayer;
