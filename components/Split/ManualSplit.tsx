import React, { useState } from 'react';
import { SplitInterface } from '@/types/SplitInterface';

interface User {
    name: string;
}

const ManualSplit: React.FC<SplitInterface> = ({ expense }) => {
    const users: User[] = [
        { name: 'chua' },
        { name: 'isyraf' },
        { name: 'kiachu' },
        { name: 'keachu' },
    ];

    // State to hold the amounts entered for each user
    const [amounts, setAmounts] = useState<{ [key: string]: number }>({});
    
    // Total expense passed as a prop
    const totalExpense = expense.amount;

    // Handle changes to user amounts
    const handleAmountChange = (userName: string, value: string) => {
        const newValue = value === '' ? 0 : parseFloat(value); // Convert to number or set to 0
        setAmounts((prevAmounts) => ({
            ...prevAmounts,
            [userName]: newValue,
        }));
    };

    // Calculate the total entered amount
    const totalEnteredAmount = Object.values(amounts).reduce((acc, amount) => acc + amount, 0);

    // Calculate amounts owed by users who haven't entered a value
    const calculateAmounts = () => {
        const remainingAmount = totalExpense - totalEnteredAmount;
        const usersWithoutAmount = users.filter(user => !(user.name in amounts)).length;

        // Distribute the remaining amount equally among users who haven't entered an amount
        const perUserAmount = usersWithoutAmount > 0 ? remainingAmount / usersWithoutAmount : 0;

        return users.map((user) => {
            return amounts[user.name] !== undefined ? amounts[user.name] : perUserAmount; // Return entered amount or calculated amount
        });
    };

    const calculatedAmounts = calculateAmounts();

    const renderUsers = users.map((user, index) => (
        <div key={user.name}>
            <div className="flex flex-row border rounded my-2">
                <div className="flex flex-row w-full justify-between content-center px-2">
                    <p className="my-auto">{user.name}</p>
                    <p className="my-auto">{calculatedAmounts[index].toFixed(2)} RM</p>
                </div>
                <p className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100">x</p>
            </div>
            <div className='flex flex-row border rounded my-2'>
                <p className="border-r p-2 m-0 text-center text-gray-500 font-normal hover:bg-gray-100">Amount</p>
                <input
                    className='focus:outline-indigo-600 p-2 w-full'
                    type='number'
                    value={amounts[user.name] || ''} // Allow empty input for amounts
                    onChange={(e) => handleAmountChange(user.name, e.target.value)} // Handle amount change
                />
            </div>
        </div>
    ));

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>
                    Specify exactly how much each person owes.
                </div>
                <div><b className='font-bold'>Total: </b>{"RM " + totalExpense.toFixed(2)}</div>
                <div><b className='font-bold'>Total Entered: </b>{"RM " + totalEnteredAmount.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderUsers}
            </div>
        </div>
    );
};

export default ManualSplit;
