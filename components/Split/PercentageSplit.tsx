import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext'; // Access the ExpenseContext
import DisplaySplitter from './DisplaySplitter';

const PercentageSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount } = useExpense(); // Access the expense context

    // Initialize the percentage state for each friend based on the existing expense (if any)
    const initialPercentages = expense?.splitter?.reduce((acc, friend) => {
        if (expense?.id) {
            // If expense has an ID (existing expense), calculate percentage based on the split amounts
            acc[friend.id] = (friend.amount / expense.amount) * 100;
        } else {
            // If no existing expense, initialize percentage to 0
            acc[friend.id] = 0;
        }
        return acc;
    }, {} as { [key: string]: number }) || {}; // Default to empty object if no expense

    const [percentages, setPercentages] = useState<{ [key: string]: number }>(initialPercentages);

    const totalExpense = expense?.amount ?? 0; // Total amount of the expense
    const totalPercentage = Object.values(percentages).reduce((acc, curr) => acc + curr, 0);
    const underBy = 100 - totalPercentage;

    // Handle percentage changes for each friend
    const handlePercentageChange = (friendId: string, value: number) => {
        setPercentages((prev) => ({
            ...prev,
            [friendId]: Math.max(0, Math.min(100, value)), // Ensure values are between 0 and 100
        }));
    };

    // Handle friend removal from the split
    const handleRemoveFriend = (friendId: string) => {
        removeFriendFromSplit(friendId); // Call context function to remove the friend
    };

    // Update friend amounts in the context whenever percentages change
    useEffect(() => {
        if (expense?.splitter) {
            expense.splitter.forEach((friend) => {
                const friendPercentage = percentages[friend.id] || 0;
                const amountOwed = (friendPercentage / 100) * totalExpense;
                updateFriendAmount(friend.id, amountOwed); // Update each friend's owed amount
            });
        }
    }, [percentages, expense.splitter.length]);

    // Render the list of expense.splitter with their percentage inputs and calculated amounts
    const renderFriends = expense?.splitter?.map((friend) => (
        <div key={friend.id}>
            <div className="flex flex-row border rounded my-2">
                <DisplaySplitter
                    key={friend.id}
                    friend={friend}
                    handleRemoveFriend={handleRemoveFriend}
                />
            </div>
            <div className="flex flex-row border rounded my-2">
                <p className="w-8 border-r py-2 m-0 text-center hover:bg-gray-100">%</p>
                <input
                    className="focus:outline-indigo-600 p-2 w-full"
                    type="number"
                    value={percentages[friend.id]}
                    onChange={(e) => handlePercentageChange(friend.id, Number(e.target.value))}
                    min="0"
                    max="100"
                />
            </div>
        </div>
    ));

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
