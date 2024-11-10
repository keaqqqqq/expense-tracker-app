import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext'; // Access the ExpenseContext

const WeightSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount } = useExpense(); // Access the expense context

    // Initialize weights state for each friend
    const initialWeights = expense.spliter.reduce((acc, friend) => {
        acc[friend.id] = 0; // Initialize to 0 weight for each friend
        return acc;
    }, {} as { [key: string]: number });

    const [weights, setWeights] = useState<{ [key: string]: number }>(initialWeights);

    const totalExpense = expense.amount; // Total amount of the expense
    const totalWeight = Object.values(weights).reduce((acc, curr) => acc + curr, 0); // Sum of all weights

    // Calculate the amounts based on weights
    const userAmounts = expense.spliter.map(friend => {
        const friendWeight = weights[friend.id] || 0;
        const amount = totalWeight > 0
            ? ((friendWeight / totalWeight) * totalExpense).toFixed(2)
            : '0.00'; // Avoid division by zero
        return {
            name: friend.name,
            amount,
        };
    });

    // Handle weight change for each friend
    const handleWeightChange = (friendId: string, value: number) => {
        setWeights((prev) => ({
            ...prev,
            [friendId]: Math.max(0, value), // Ensure weights are non-negative
        }));
    };

    const handleRemoveFriend = (friendId: string) => {
        // Remove the friend from the split
        removeFriendFromSplit(friendId);

        // Reset the weight for the friend
        setWeights((prevWeights) => {
            const newWeights = { ...prevWeights };
            delete newWeights[friendId]; // Remove the weight of the removed friend
            return newWeights;
        });

        // Reset the friend's amount owed to 0
        updateFriendAmount(friendId, 0);
    };
    // Handle friend removal from the split
   

    // Update friend amounts based on weights whenever they change
    useEffect(() => {
        expense.spliter.forEach((friend) => {
            const friendWeight = weights[friend.id] || 0;
            const amountOwed = totalWeight > 0 ? Number(((friendWeight / totalWeight) * totalExpense).toFixed(2)): 0;
            updateFriendAmount(friend.id, amountOwed); // Update each friend's owed amount in the context
        });
        console.log(expense)
        
    }, [weights, totalWeight, totalExpense, expense.spliter.length]);

    const renderFriends = expense.spliter.map((friend) => (
        <div key={friend.id}>
            <div className="flex flex-row border rounded my-2">
                <div className="flex flex-row w-full justify-between content-center px-2">
                    <p className="my-auto">{friend.name}</p>
                    <p className="my-auto">{userAmounts.find(u => u.name === friend.name)?.amount} RM</p>
                </div>
                <button
                    className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100"
                    onClick={() => handleRemoveFriend(friend.id)} // Remove friend when clicked
                >
                    x
                </button>
            </div>
            <div className="flex flex-row border rounded my-2">
                <p className="w-16 border-r py-2 m-0 text-center text-gray-500 font-normal hover:bg-gray-100">Weight</p>
                <input
                    className="focus:outline-indigo-600 p-2 w-full"
                    type="number"
                    value={weights[friend.id]}
                    onChange={(e) => handleWeightChange(friend.id, Number(e.target.value))}
                    min="0"
                />
            </div>
        </div>
    ));

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>Specify how the expense should be split based on weights (e.g., time-based or family-size splitting).</div>
                <div><b className="font-bold">Total weight:</b> {totalWeight}</div>
                <div><b className="font-bold">Total expense:</b> {totalExpense} RM</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderFriends}
            </div>
        </div>
    );
};

export default WeightSplit;
