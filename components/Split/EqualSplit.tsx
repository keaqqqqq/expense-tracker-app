import { useExpense } from '@/context/ExpenseContext';
import React, { useEffect } from 'react';
import DisplaySplitter from './DisplaySplitter';

const EqualSplit: React.FC = () => {
    const {
        expense,
        removeFriendFromSplit,
        updateFriendAmount,
        setSplitData,
        friendList,
    } = useExpense(); // Get context functions

    // Function to remove a friend from the split
    const handleRemoveFriend = (friendId: string) => {
        removeFriendFromSplit(friendId); // Call context function to remove the friend
    };
    useEffect(() => {
        if (expense.split_preference === 'equal') {
            const totalAmountInCents = Math.round(expense.amount * 100); // Convert total amount to cents
            const friendAmountInCents = Math.round((expense.amount / expense.splitter.length) * 100); // Convert friend amount to cents
    
            let totalDistributed = 0;
    
            // Update the amounts for all friends equally in cents
            expense.splitter.forEach((friend) => {
                updateFriendAmount(friend.id, friendAmountInCents / 100);
                totalDistributed += friendAmountInCents;
            });
    
            // Adjust the total to match the actual expense if needed
            let difference = totalAmountInCents - totalDistributed;
            let i = 0;
    
            // Add or deduct 0.01 from the first few friends until the total matches
            while (Math.abs(difference) > 0 && i < expense.splitter.length) {
                const friendId = expense.splitter[i].id;
                const currentAmountInCents = friendAmountInCents;
    
                if (difference > 0) {
                    // Add 0.01 to the first few friends if the total is less than the expense
                    updateFriendAmount(friendId, (currentAmountInCents + 1) / 100); // Increment by 1 cent
                    difference -= 1;
                } else if (difference < 0) {
                    // Deduct 0.01 from the first few friends if the total exceeds the expense
                    const newAmountInCents = Math.max(0, currentAmountInCents - 1);
                    updateFriendAmount(friendId, newAmountInCents / 100); // Decrement by 1 cent
                    difference += 1;
                }
                i++;
            }
    
            // Clear the split data if necessary
            setSplitData([]);
        }
    }, [expense.splitter.length, expense.amount, expense.split_preference, expense.group_id]);
    

    useEffect(() => {
        console.log(expense.splitter);
    }, [expense.splitter]);

    const renderFriends = expense.splitter.map((friend) => {
        const friendInfo = friendList.find((user) => user.id === friend.id);
        if (friendInfo) {
            return (
                <div className="flex flex-row border rounded" key={friend.id}>
                    <DisplaySplitter
                        key={friend.id}
                        friend={{ ...friendInfo, amount: friend.amount }}
                        handleRemoveFriend={handleRemoveFriend}
                    />
                </div>
            );
        }
        return null;
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
