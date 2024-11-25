import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext'; // Access the ExpenseContext
import DisplaySplitter from './DisplaySplitter';

const ManualSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount, setSplitData, friendList } = useExpense(); // Access the expense context

    // State to hold the amounts entered for each friend
    const [amounts, setAmounts] = useState<{ [key: string]: number }>({});

    // Total expense from the context
    const totalExpense = expense.amount;

    // Handle changes to friend amounts
    const handleAmountChange = (friendId: string, value: string) => {
        const newValue = value === '' ? 0 : parseFloat(value); // Convert to number or set to 0
        setAmounts((prevAmounts) => ({
            ...prevAmounts,
            [friendId]: newValue,
        }));

        if (expense.split_data) {
            // Update split_data by checking if the id already exists
            const updatedSplitData = expense.split_data.map((data) =>
                data.id === friendId
                    ? { ...data, value: newValue } // Update the existing entry
                    : data
            );

            // If friendId doesn't exist in split_data, add a new entry
            if (!expense.split_data.some((data) => data.id === friendId)) {
                updatedSplitData.push({ id: friendId, value: newValue });
            }

            setSplitData(updatedSplitData); // Set the updated split data
        } else {
            // If split_data doesn't exist yet, initialize it with the new entry
            setSplitData([{ id: friendId, value: newValue }]);
        }
    };

    const handleRemoveFriend = (friendId: string) => {
        // Remove the friend from the split
        removeFriendFromSplit(friendId);

        // Reset the weight for the friend
        setAmounts((prevAmounts) => {
            const newAmounts = { ...prevAmounts };
            delete newAmounts[friendId]; // Remove the weight of the removed friend
            return newAmounts;
        });

        if (expense.split_data) {
            const updatedSplitData = expense.split_data.filter((data) => data.id !== friendId);
            setSplitData(updatedSplitData); // Update the split data
        }

    };
    useEffect(() => {
        setAmounts({});
        if (expense.split_data) {
            expense.split_data.forEach((d) => {
                setAmounts((prev) => ({
                    ...prev,
                    [d.id]: d.value, 
                }));
            })
        }
    }, [expense.split_data?.length]);
    // Reset the amount for a specific friend when the "x" button is clicked
    const handleResetAmount = (friendId: string) => {
        setAmounts((prevAmounts) => {
            const newAmounts = { ...prevAmounts };
            delete newAmounts[friendId]; // Remove the entered amount for this friend
            return newAmounts;
        });

        if (expense.split_data) {
            const updatedSplitData = expense.split_data.filter((data) => data.id !== friendId);
            setSplitData(updatedSplitData); // Update the split data
        }
    };

    // Calculate the total entered amount
    const totalEnteredAmount = Object.values(amounts).reduce((acc, amount) => acc + amount, 0);

    // Calculate amounts owed by friends who haven't entered a value
    const calculateAmounts = () => {
        const remainingAmount = totalExpense - totalEnteredAmount;
        const friendsWithoutAmount = expense.splitter.filter(friend => !(friend.id in amounts)).length;

        // Distribute the remaining amount equally among friends who haven't entered an amount
        const perfriendAmount = friendsWithoutAmount > 0 ? remainingAmount / friendsWithoutAmount : 0;

        return expense.splitter.map((friend) => {
            return amounts[friend.id] !== undefined ? amounts[friend.id] : perfriendAmount; // Return entered amount or calculated amount
        });
    };

    const calculatedAmounts = calculateAmounts();

    // Update each friend's amount in the context
    useEffect(() => {
        expense.splitter.forEach((friend) => {
            const adjustedAmount = amounts[friend.id] !== undefined ? amounts[friend.id] : calculatedAmounts[expense.splitter.findIndex(f => f.id === friend.id)];
            updateFriendAmount(friend.id, adjustedAmount); // Update the amount in the context
        });
        console.log(expense);
    }, [amounts, expense.splitter.length, expense.split_data?.length]);

    // Render expense.splitter list with the entered amounts or calculated ones
    const renderFriends = expense.splitter.map((friend, index) => {
        const friendInfo = friendList.find(user => user.id === friend.id);
        if (friendInfo) {
            return (<div key={friend.id}>
                <div className="flex flex-row border rounded my-2">
                    <DisplaySplitter
                        key={friend.id}
                        friend={{ ...friendInfo, amount: friend.amount }}
                        handleRemoveFriend={handleRemoveFriend}
                    />
                </div>
                <div className="flex flex-row border rounded my-2">
                    <p className="border-r p-2 m-0 text-center text-gray-500 font-normal hover:bg-gray-100">Amount</p>
                    <input
                        className="focus:outline-indigo-600 p-2 w-full"
                        type="number"
                        value={amounts[friend.id] || ''} // Allow empty input for amounts
                        onChange={(e) => handleAmountChange(friend.id, e.target.value)} // Handle amount change
                    />
                    {amounts[friend.id] !== undefined && (
                        <button
                            className="p-2 text-gray-500"
                            onClick={() => handleResetAmount(friend.id)} // Reset the amount when clicked
                        >
                            x
                        </button>
                    )}
                </div>
            </div>)
        }
    });

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>
                    Specify exactly how much each person owes.
                </div>
                <div><b className="font-bold">Total: </b>{"RM " + totalExpense.toFixed(2)}</div>
                <div><b className="font-bold">Total Entered: </b>{"RM " + totalEnteredAmount.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderFriends}
            </div>
        </div>
    );
};

export default ManualSplit;
