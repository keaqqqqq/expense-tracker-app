import { useExpense } from '@/context/ExpenseContext';
import React, { useEffect, useState } from 'react';
import DisplaySplitter from './DisplaySplitter';

const ExtraSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount } = useExpense(); // Access the expense context
    
    // State to track adjustments for each friend (using their id as key)
    const [adjustments, setAdjustments] = useState<{ [key: string]: number }>({});

    // Set initial adjustments state based on the expense.splitter list
    useEffect(() => {
        const initialAdjustments = expense.splitter.reduce((acc, friend) => {
            acc[friend.id] = 0; // Initialize adjustments for each friend to 0
            return acc;
        }, {} as { [key: string]: number });

        setAdjustments(initialAdjustments);
    }, []);

    // Function to remove a friend from the split
    const handleRemoveFriend = (friendId: string) => {
        // Remove the friend from the split
        removeFriendFromSplit(friendId);

        // Reset the weight for the friend
        setAdjustments((prevAdjustments) => {
            const newAdjustments = { ...prevAdjustments };
            delete newAdjustments[friendId]; // Remove the weight of the removed friend
            return newAdjustments;
        });

    };

    // Handle adjustment changes for each friend
    const handleAdjustmentChange = (friendId: string, value: number) => {
        setAdjustments((prev) => ({
            ...prev,
            [friendId]: value,
        }));
    };

    // Calculate total adjustments and the remainder
    const totalAdjustments = Object.values(adjustments).reduce((acc, curr) => acc + curr, 0);
    const remainingAmount = expense.amount - totalAdjustments;
    const splitAmount = remainingAmount / expense.splitter.length;

    // Update each friend's adjusted amount in the context
    useEffect(() => {
        expense.splitter.forEach((friend) => {
            const adjustedAmount = (adjustments[friend.id] || 0) + splitAmount;
            updateFriendAmount(friend.id, adjustedAmount); // Update the amount in the context
        });
    }, [adjustments, splitAmount, expense.splitter.length]);

    
    // Render the selected expense.splitter with their adjusted amounts
    const renderFriends = expense.splitter.map((friend) => (
        <div key={friend.id}>
            <div className="flex flex-row border rounded my-2">
            <DisplaySplitter
                    key={friend.id}
                    friend={friend}
                    handleRemoveFriend={handleRemoveFriend}
                />
            </div>
            <div className="flex flex-row border rounded my-2">
                <p className="w-8 border-r py-2 m-0 text-center hover:bg-gray-100">+</p>
                <input
                    className="focus:outline-indigo-600 p-2 w-full"
                    type="number"
                    value={adjustments[friend.id]}
                    onChange={(e) => handleAdjustmentChange(friend.id, Number(e.target.value))}
                />
            </div>
        </div>
    ));

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>
                    Enter adjustments to reflect who owes extra. The remainder will be split equally.
                </div>
                <div><b className="font-bold">Total adjustments:</b> RM {totalAdjustments.toFixed(2)}</div>
                <div><b className="font-bold">Remaining amount to split:</b> RM {remainingAmount.toFixed(2)}</div>
                <div><b className="font-bold">Amount per friend:</b> RM {splitAmount.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderFriends}
            </div>
        </div>
    );
};

export default ExtraSplit;
