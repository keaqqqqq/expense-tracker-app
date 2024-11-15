import React, { useState } from 'react';
import { SplitFriend } from '@/types/SplitFriend';
import { useExpense } from '@/context/ExpenseContext';

const AddSplit: React.FC = () => {
  const { friendList, expense, addFriendToSplit } = useExpense();
  const [selectedFriend, setSelectedFriend] = useState<Omit<SplitFriend, 'amount'> | null>(null);

  // Handle when a user selects a friend to add to the split
  const handleSelectFriend = (friend: Omit<SplitFriend, 'amount'>) => {
    if (!expense.spliter.some(f => f.id === friend.id)) {
      addFriendToSplit(friend);
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
        className="px-4 py-2 border border-gray-300 rounded-md"
      >
        <option value="" disabled>Select a friend</option>
        {friendList
          .filter(friend => !expense.spliter.some(f => f.id === friend.id)) // Exclude already added expense.spliter
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

export default AddSplit;
