import React, { useEffect, useState } from 'react';
import { SplitFriend } from '@/types/SplitFriend';
import { useExpense } from '@/context/ExpenseContext';
import { Group } from '@/types/Group';

const AddSplit: React.FC = () => {
  const { friendList, expense, addFriendToSplit , groupList, setGroup, setFriendList, setExpense, initialFriendList} = useExpense();
  const [selectedFriend, setSelectedFriend] = useState<Omit<SplitFriend, 'amount'> | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group|null>(null);
  const [groupFriend, setGroupFriend] = useState<{id:string, amount: number}[]>([]);
  

  useEffect(()=>{
    if(expense.group_id){
      setSelectedGroup(groupList.find(gl=>gl.id==expense.group_id)|| null);
      handleSelectGroup(groupList.find(gl=>gl.id==expense.group_id))
    }
  },[])
  // Handle when a user selects a friend to add to the split
  const handleSelectFriend = (friend: Omit<SplitFriend, 'amount'>) => {
    if (!expense.splitter.some(f => f.id === friend.id)) {
      addFriendToSplit(friend.id);
      setSelectedFriend(null); // Clear the selected friend
    }
  };
  
  const handleSelectGroup = (group: Group | undefined) => {
    setGroup(group?.id || "");
    
    // First, remove all previous group members from splitter
    const splitter = expense.splitter.filter(s => !groupFriend.some(gf => gf.id === s.id));
    
    // Initialize new group members array with type specification
    const tempGroupFriend: {id: string, amount: number}[] = [];
    
    // Process each group member, checking against filtered splitter
    group?.members.forEach((m) => {
        // Only add if member is not already in the filtered splitter list
        // This prevents duplicates when switching between groups
        if (!splitter.some(f => f.id === m.id) && 
            !tempGroupFriend.some(t => t.id === m.id)) {
            setSelectedFriend(null);
            tempGroupFriend.push({
                id: m.id || '',
                amount: 0
            });
        }
        
        // Update friend list if needed
        if (!initialFriendList.some(f => f.id === m.id)) {
            setFriendList([
                ...initialFriendList,
                {
                    id: m.id || '',
                    name: m.name || '',
                    email: m.email || '',
                    image: m.image || ''
                }
            ]);
        }
    });

    // Update group friends state
    setGroupFriend(tempGroupFriend);
    
    // Combine filtered splitter with new group members
    const newSplitter = [...splitter, ...tempGroupFriend];
    const filteredSplitData = expense.split_data?.filter(sd => 
      newSplitter.some(ns => ns.id === sd.id)
  ) || [];
    setExpense(({
        ...expense,
        splitter: newSplitter,
        group_id: group?.id,
        split_data:filteredSplitData,
    }));
    
    console.log('New splitter array:', newSplitter);
    // console.log("group id", group.id);
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
          }else{
            handleSelectGroup(undefined);
          }
        }}
        className="px-4 py-2 border border-gray-300 rounded-md"
      >
        <option value="">Select a group</option>
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
