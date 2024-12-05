import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext'; // Access the ExpenseContext
import DisplaySplitter from './DisplaySplitter';

const WeightSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount, setSplitData, friendList } = useExpense(); // Access the expense context

    // Initialize weights state for each friend
    const initialWeights = expense.splitter.reduce((acc, friend) => {
        acc[friend.id] = 0; // Initialize to 0 weight for each friend
        return acc;
    }, {} as { [key: string]: number });

    const [weights, setWeights] = useState<{ [key: string]: number }>(initialWeights);

    const totalExpense = expense.amount; // Total amount of the expense
    const totalWeight = Object.values(weights).reduce((acc, curr) => acc + curr, 0); // Sum of all weights

    // Handle weight change for each friend
    const handleWeightChange = (friendId: string, value: number) => {
        setWeights((prev) => ({
            ...prev,
            [friendId]: Math.max(0, value), // Ensure weights are non-negative
        }));

        if (expense.split_data) {
            // Update split_data by checking if the id already exists
            const updatedSplitData = expense.split_data.map((data) =>
                data.id === friendId
                    ? { ...data, value } // Update the existing entry
                    : data
            );

            // If friendId doesn't exist in split_data, add a new entry
            if (!expense.split_data.some((data) => data.id === friendId)) {
                updatedSplitData.push({ id: friendId, value });
            }

            setSplitData(updatedSplitData); // Set the updated split data
        } else {
            // If split_data doesn't exist yet, initialize it with the new entry
            setSplitData([{ id: friendId, value }]);
        }
    };

    useEffect(() => {
        setWeights({});
        if (expense.split_data) {
            expense.split_data.forEach((d) => {
                setWeights((prev) => ({
                    ...prev,
                    [d.id]: Math.max(0, d.value), // Ensure values are non-negative
                }));
            });
        }
    }, [expense.split_data?.length]);

    const handleRemoveFriend = (friendId: string) => {
        // Remove the friend from the split
        removeFriendFromSplit(friendId);

        // Reset the weight for the friend
        setWeights((prevWeights) => {
            const newWeights = { ...prevWeights };
            delete newWeights[friendId]; // Remove the weight of the removed friend
            return newWeights;
        });

        if (expense.split_data) {
            const updatedSplitData = expense.split_data.filter((data) => data.id !== friendId);
            setSplitData(updatedSplitData); // Update the split data
        }

        // Reset the friend's amount owed to 0
        updateFriendAmount(friendId, 0);
    };

    // Update friend amounts based on weights whenever they change
    useEffect(() => {
        const baseAmountPerWeight = totalWeight > 0 ? totalExpense / totalWeight : 0;
        let totalDistributed = 0;
    
        // Calculate the initial distribution of amounts
        expense.splitter.forEach((friend) => {
            const friendWeight = weights[friend.id] || 0;
            const amountOwed = Number((friendWeight * baseAmountPerWeight).toFixed(2));
            updateFriendAmount(friend.id, amountOwed); // Update each friend's owed amount in the context
            totalDistributed += amountOwed;
        });
    
        // Check if there is any leftover amount to be distributed
        const remainder = totalExpense - totalDistributed;
        if (remainder > 0 && expense.splitter.length > 0) {
            let adjustment = 0;
            let i = 0;
    
            // Distribute the remainder in 0.01 increments to the first few friends
            while (adjustment < remainder && i < expense.splitter.length) {
                const friendId = expense.splitter[i].id;
                if (weights[friendId] > 0) {
                    const additionalAmount = Math.min(0.01, remainder - adjustment); // Ensure we don't exceed the remainder
                    const currentAmount = Number((weights[friendId] * baseAmountPerWeight).toFixed(2));
                    updateFriendAmount(friendId, currentAmount + additionalAmount); // Update the friend's amount with the extra 0.01
                    adjustment += additionalAmount; // Increment the adjustment total
                }
                i++;
            }
        } else if (totalDistributed > totalExpense) {
            // Deduct from the first few friends if totalDistributed exceeds totalExpense
            let excessAmount = totalDistributed - totalExpense;
            let i = 0;
    
            while (excessAmount > 0 && i < expense.splitter.length) {
                const friendId = expense.splitter[i].id;
                if (weights[friendId] > 0) {
                    // Deduct 0.01 or the remaining excess amount, whichever is smaller
                    const deductionAmount = Math.min(0.01, excessAmount);
                    const currentAmount = Number((weights[friendId] * baseAmountPerWeight).toFixed(2));
                    const newAmount = Math.max(0, currentAmount - deductionAmount); // Ensure it doesn't go below 0
                    updateFriendAmount(friendId, newAmount); // Deduct the amount from the friend's owed amount
                    excessAmount -= deductionAmount; // Decrease the excess amount
                }
                i++;
            }
        }
    }, [weights, totalWeight, totalExpense, expense.splitter.length]);
    
    

    const renderFriends = expense.splitter.map((friend) => {
        const friendInfo = friendList.find(user => user.id === friend.id);
        if (friendInfo) {
            return (
                <div key={friend.id}>
                    <div className="flex flex-row border rounded my-2">
                        <DisplaySplitter
                            key={friend.id}
                            friend={{ ...friendInfo, amount: friend.amount }}
                            handleRemoveFriend={handleRemoveFriend}
                        />
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
            );
        }
        return null;
    });

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
