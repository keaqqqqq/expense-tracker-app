import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext'; // Access the ExpenseContext
import DisplaySplitter from './DisplaySplitter';

const PercentageSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount, setSplitData, friendList } = useExpense(); // Access the expense context

    // Initialize the percentage state for each friend
    const initialPercentages = expense.splitter.reduce((acc, friend) => {
        acc[friend.id] = 0; // Initialize to 0 percent for each friend
        return acc;
    }, {} as { [key: string]: number });

    const [percentages, setPercentages] = useState<{ [key: string]: number }>(initialPercentages);

    const totalExpense = expense.amount; // Total amount of the expense
    const totalPercentage = Object.values(percentages).reduce((acc, curr) => acc + curr, 0);
    const underBy = 100 - totalPercentage;

    // Handle percentage changes for each friend
    const handlePercentageChange = (friendId: string, value: number) => {
        setPercentages((prev) => ({
            ...prev,
            [friendId]: Math.max(0, Math.min(100, value)), // Ensure values are between 0 and 100
        }));
    
        if (expense.split_data) {
            // Update split_data by checking if the id already exists
            const updatedSplitData = expense.split_data.map((data) =>
                data.id === friendId
                    ? { ...data, value: Math.max(0, Math.min(100, value)) } // Update the existing entry
                    : data
            );
    
            // If friendId doesn't exist in split_data, add a new entry
            if (!expense.split_data.some((data) => data.id === friendId)) {
                updatedSplitData.push({ id: friendId, value: Math.max(0, Math.min(100, value)) });
            }
    
            setSplitData(updatedSplitData); // Set the updated split data
        } else {
            // If split_data doesn't exist yet, initialize it with the new entry
            setSplitData([{ id: friendId, value: Math.max(0, Math.min(100, value)) }]);
        }
    };

    // Handle friend removal from the split
    const handleRemoveFriend = (friendId: string) => {
        if (expense.split_data) {
            const updatedSplitData = expense.split_data.filter((data) => data.id !== friendId);
            setSplitData(updatedSplitData); // Update the split data
        }
        removeFriendFromSplit(friendId); // Call context function to remove the friend
    };

    // Update friend amounts in the context whenever percentages change
    useEffect(() => {
        expense.splitter.forEach((friend) => {
            const friendPercentage = percentages[friend.id] || 0;
            const amountOwed = (friendPercentage / 100) * totalExpense;
            updateFriendAmount(friend.id, amountOwed); // Update each friend's owed amount
        });
       
    }, [percentages, totalExpense, expense.splitter.length]);

    useEffect(()=>{
        if(expense.id && expense.split_data){
            expense.split_data.forEach((d)=>{
                setPercentages((prev) => ({
                    ...prev,
                    [d.id]: Math.max(0, Math.min(100, d.value)), // Ensure values are between 0 and 100
                }));
            })
        }        
    },[]);

    // Render the list of expense.splitter with their percentage inputs and calculated amounts
    const renderFriends = expense.splitter.map((splitterFriend) => {
        // Find the friend info from the friendList
        const friendInfo = friendList.find(friend => friend.id === splitterFriend.id);
    
        // Check if the friend information exists
        if (friendInfo) {
            return (
                <div key={splitterFriend.id}>
                    <div className="flex flex-row border rounded my-2">
                        <DisplaySplitter
                            key={splitterFriend.id}
                            friend={{ ...friendInfo, amount: splitterFriend.amount }}
                            handleRemoveFriend={handleRemoveFriend}
                        />
                    </div>
                    <div className="flex flex-row border rounded my-2">
                        <p className="w-8 border-r py-2 m-0 text-center hover:bg-gray-100">%</p>
                        <input
                            className="focus:outline-indigo-600 p-2 w-full"
                            type="number"
                            value={percentages[splitterFriend.id]}
                            onChange={(e) => handlePercentageChange(splitterFriend.id, Number(e.target.value))}
                            min="0"
                            max="100"
                        />
                    </div>
                </div>
            );
        }
    
        return null; // Return null if the friendInfo is not found
    });

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>Specify the percentages that are fair for your situation.</div>
                <div>Total percentage: {totalPercentage}%</div>
                {totalPercentage < 100 && (
                    <div className="text-red-500 font-bold">Under by: {underBy}%</div>
                )}
                {totalPercentage > 100 && (
                    <div className="text-red-500 font-bold">Exceeded by: {totalPercentage - 100}%</div>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderFriends}
            </div>
        </div>
    );
};

export default PercentageSplit;
