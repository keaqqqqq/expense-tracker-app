import { useExpense } from '@/context/ExpenseContext';
import React, { useEffect, useState } from 'react';
import DisplaySplitter from './DisplaySplitter';

const ExtraSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount, setSplitData, friendList } = useExpense(); // Access the expense context

    // State to track adjustments for each friend (using their id as key)
    const [adjustments, setAdjustments] = useState<{ [key: string]: number }>({});

    // Set initial adjustments state based on the expense.splitter list
    useEffect(() => {
        const initialAdjustments = expense.splitter.reduce((acc, friend) => {
            acc[friend.id] = 0; // Initialize adjustments for each friend to 0
            return acc;
        }, {} as { [key: string]: number });

        setAdjustments(initialAdjustments);
        if (expense.split_data) {
            expense.split_data.forEach((d) => {
                setAdjustments((prev) => ({
                    ...prev,
                    [d.id]: d.value, // Ensure values are between 0 and 100
                }));
            })
        }
    }, [expense.split_data?.length]);

    

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

        if (expense.split_data) {
            const updatedSplitData = expense.split_data.filter((data) => data.id !== friendId);
            setSplitData(updatedSplitData); // Update the split data
        }

    };

    // Handle adjustment changes for each friend
    const handleAdjustmentChange = (friendId: string, value: number) => {
        setAdjustments((prev) => ({
            ...prev,
            [friendId]: value,
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

    // Calculate total adjustments and the remainder
    const totalAdjustments = Object.values(adjustments).reduce((acc, curr) => acc + curr, 0);
    const remainingAmount = expense.amount - totalAdjustments;
    const splitAmount = remainingAmount / expense.splitter.length;

    // Update each friend's adjusted amount in the context
    useEffect(() => {
        let totalDistributedAmount = 0;
    
        // Calculate total distributed amount and round to two decimal places
        const updatedAmounts = expense.splitter.map((friend) => {
            const adjustedAmount = Number(((adjustments[friend.id] || 0) + splitAmount).toFixed(2));
            totalDistributedAmount += adjustedAmount;
            return { id: friend.id, amount: adjustedAmount };
        });
    
        // Calculate the remainder and round to two decimal places
        let remainder = Number((expense.amount - totalDistributedAmount).toFixed(2));
    
        // Distribute the remainder among the first few friends
        let distributed = 0;
        const finalAmounts = updatedAmounts.map((friend) => {
            if (distributed < Math.abs(remainder) && remainder !== 0) {
                const adjustment = remainder > 0 ? 0.01 : -0.01;
                distributed = Number((distributed + Math.abs(adjustment)).toFixed(2));
                remainder = Number((remainder - adjustment).toFixed(2));
                return { id: friend.id, amount: Number((friend.amount + adjustment).toFixed(2)) };
            }
            return friend;
        });
    
        // Update the amounts in the context
        finalAmounts.forEach((friend) => {
            updateFriendAmount(friend.id, friend.amount);
        });
    }, [adjustments, splitAmount, expense.splitter.length, expense.amount]);
    




    // Render the selected expense.splitter with their adjusted amounts
    const renderFriends = expense.splitter.map((friend) => {
        const friendInfo = friendList.find(user => user.id === friend.id);
        if(friendInfo){
            return( <div key={friend.id}>
            <div className="flex flex-row border rounded my-2">
                <DisplaySplitter
                    key={friend.id}
                    friend={{...friendInfo, amount: friend.amount}}
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
        </div>)
        }
        return null;
    });

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
