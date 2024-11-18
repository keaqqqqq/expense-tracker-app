import React, { useEffect, useState } from 'react';
import { SplitFriend } from '@/types/SplitFriend';
import { useExpense } from '@/context/ExpenseContext';
import { Group } from '@/types/Group';

const AddSplit: React.FC = () => {
  const { friendList, expense, addFriendToSplit , groupList} = useExpense();
  const [selectedFriend, setSelectedFriend] = useState<Omit<SplitFriend, 'amount'> | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group|null>(null);
  

  // Handle when a user selects a friend to add to the split
  const handleSelectFriend = (friend: Omit<SplitFriend, 'amount'>) => {
    if (!expense.splitter.some(f => f.id === friend.id)) {
      addFriendToSplit(friend);
      setSelectedFriend(null); // Clear the selected friend
    }
  };
  
  const handleSelectGroup = (group: Group) => {
    group.members.forEach((m)=>{
      if (!expense.splitter.some(f => f.id === m.id)) {
        addFriendToSplit({
          name: m.name || "",
          email: m.email || '',
          id: m.id || "",
          image: m.image || ""
        });
        console.log(m);
        setSelectedFriend(null); // Clear the selected friend
      }
    })
  };

  return (<>
    <div className="flex flex-col w-full mb-2 sm:mb-0 sm:mr-2"> {/* Spacing for small screens */}
    within group 
    <div className="flex flex-col w-full my-2">
      <select
        id="group"
        value={selectedGroup?.id || ''}
        onChange={(e) => {
          const group = groupList.find(f => f.id === e.target.value);
          if (group) {
            setSelectedGroup(group);
            handleSelectGroup(group);
          }
        }}
        className="px-4 py-2 border border-gray-300 rounded-md"
      >
        <option value="" disabled>Select a group</option>
        {groupList
          .filter(friend => !expense.splitter.some(f => f.id === friend.id)) // Exclude already added expense.splitter
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
</div>
<div className="flex flex-col w-full"> 
    Add split
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
          .filter(friend => !expense.splitter.some(f => f.id === friend.id)) // Exclude already added expense.splitter
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
</div>
  </>
  );
};

export default AddSplit;
