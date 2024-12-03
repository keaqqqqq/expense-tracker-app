import { useExpense } from '@/context/ExpenseContext';
import React, { useEffect } from 'react';
import DisplaySplitter from './DisplaySplitter';


const EqualSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount, setSplitData, friendList } = useExpense(); // Get removeFriendFromSplit from context

    // Function to remove a friend from the split
    const handleRemoveFriend = (friendId: string) => {
        removeFriendFromSplit(friendId); // Call context function to remove the friend
    };


    useEffect(() => {
        if(expense.split_preference=='equal'){const friendAmount = Number((expense.amount / expense.splitter.length).toFixed(2))
        expense.splitter.map((friend) => updateFriendAmount(friend.id, friendAmount))}
        setSplitData([]);
    }, [expense.splitter.length, expense.amount, expense.split_preference, expense.group_id])

    useEffect(() => {
        console.log(expense.splitter);
    }, [expense.splitter])

    const renderFriends = expense.splitter.map((friend) => {
        const friendInfo = friendList.find(user => user.id === friend.id)
        if(friendInfo){
            return (
                <div className="flex flex-row border rounded" key={friend.id}>
                    <DisplaySplitter
                        key={friend.id}
                        friend={{...friendInfo, amount: friend.amount}}
                        handleRemoveFriend={handleRemoveFriend}
                    />
                </div>
    
            );
        }
        return null
    });

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                Select which people owe an equal share
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderFriends}
            </div>
        </div>
    );
};

export default EqualSplit;
