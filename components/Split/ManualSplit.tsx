import React, { useState, useEffect } from 'react';
import { useExpense } from '@/context/ExpenseContext'; // Access the ExpenseContext

const ManualSplit: React.FC = () => {
    const { expense, removeFriendFromSplit, updateFriendAmount } = useExpense(); // Access the expense context

    // State to hold the amounts entered for each friend
    const [amounts, setAmounts] = useState<{ [key: string]: number }>({});

    // Total expense from the context
    const totalExpense = expense.amount;

    // Handle changes to user amounts
    const handleAmountChange = (friendId: string, value: string) => {
        const newValue = value === '' ? 0 : parseFloat(value); // Convert to number or set to 0
        setAmounts((prevAmounts) => ({
            ...prevAmounts,
            [friendId]: newValue,
        }));
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

    };

    // Reset the amount for a specific friend when the "x" button is clicked
    const handleResetAmount = (friendId: string) => {
        setAmounts((prevAmounts) => {
            const newAmounts = { ...prevAmounts };
            delete newAmounts[friendId]; // Remove the entered amount for this friend
            return newAmounts;
        });
    };

    // Calculate the total entered amount
    const totalEnteredAmount = Object.values(amounts).reduce((acc, amount) => acc + amount, 0);

    // Calculate amounts owed by users who haven't entered a value
    const calculateAmounts = () => {
        const remainingAmount = totalExpense - totalEnteredAmount;
        const friendsWithoutAmount = expense.spliter.filter(friend => !(friend.id in amounts)).length;

        // Distribute the remaining amount equally among users who haven't entered an amount
        const perUserAmount = friendsWithoutAmount > 0 ? remainingAmount / friendsWithoutAmount : 0;

        return expense.spliter.map((friend) => {
            return amounts[friend.id] !== undefined ? amounts[friend.id] : perUserAmount; // Return entered amount or calculated amount
        });
    };

    const calculatedAmounts = calculateAmounts();

    // Update each friend's amount in the context
    useEffect(() => {
        expense.spliter.forEach((friend) => {
            const adjustedAmount = amounts[friend.id] !== undefined ? amounts[friend.id] : calculatedAmounts[expense.spliter.findIndex(f => f.id === friend.id)];
            updateFriendAmount(friend.id, adjustedAmount); // Update the amount in the context
        });
        console.log(expense);
    }, [amounts, expense.spliter.length]);

    // Render expense.spliter list with the entered amounts or calculated ones
    const renderFriends = expense.spliter.map((friend, index) => (
        <div key={friend.id}>
            <div className="flex flex-row border rounded my-2">
                <div className="flex flex-row w-full justify-between content-center px-2">
                    <p className="my-auto">{friend.name}</p>
                    <p className="my-auto">
                        {calculatedAmounts[index].toFixed(2)} RM
                    </p>
                </div>
                <button
                    className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100"
                    onClick={() => handleRemoveFriend(friend.id)} // Remove friend when clicked
                >
                    x
                </button>
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
                        className="ml-2 text-red-500"
                        onClick={() => handleResetAmount(friend.id)} // Reset the amount when clicked
                    >
                        x
                    </button>
                )}
            </div>
        </div>
    ));

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
