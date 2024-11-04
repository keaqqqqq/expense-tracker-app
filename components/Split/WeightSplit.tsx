import React, { useState } from 'react';
import { SplitInterface } from '@/types/SplitInterface';

interface User {
    name: string;
}

const WeightSplit: React.FC<SplitInterface> = ({ expense }) => {
    const users: User[] = [
        { name: 'chua' },
        { name: 'isyraf' },
        { name: 'kiachu' },
        { name: 'keachu' },
    ];

    // Initialize weights state
    const [weights, setWeights] = useState<{ [key: string]: number }>({
        chua: 0,
        isyraf: 0,
        kiachu: 0,
        keachu: 0,
    });

    // Total weight calculation
    const totalWeight = Object.values(weights).reduce((acc, curr) => acc + curr, 0);
    const totalExpense = expense.amount; // Assuming expense has an amount property

    // Calculate amounts based on weights
    const userAmounts = users.map(user => {
        return {
            name: user.name,
            amount: totalWeight > 0 ? ((weights[user.name] / totalWeight) * totalExpense).toFixed(2) : 0,
        };
    });

    const handleWeightChange = (userName: string, value: number) => {
        setWeights((prev) => ({
            ...prev,
            [userName]: Math.max(0, value), // Ensure weights are non-negative
        }));
    };

    const renderUsers = users.map((user) => (
        <div key={user.name}>
            <div className="flex flex-row border rounded my-2">
                <div className="flex flex-row w-full justify-between content-center px-2">
                    <p className="my-auto">{user.name}</p>
                    <p className="my-auto">{userAmounts.find(u => u.name === user.name)?.amount} RM</p>
                </div>
                <p className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100">x</p>
            </div>
            <div className='flex flex-row border rounded my-2'>
                <p className="border-r p-2 m-0 text-center text-gray-500 font-normal hover:bg-gray-100">Weight</p>
                <input
                    className='focus:outline-indigo-600 p-2 w-full'
                    type='number'
                    value={weights[user.name]}
                    onChange={(e) => handleWeightChange(user.name, Number(e.target.value))}
                    min="0"
                />
            </div>
        </div>
    ));

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>
                    Specify time-based splitting or family-size splitting
                </div>
                <div><b className='font-bold'>Total weight: </b>{totalWeight}</div>
                <div><b className='font-bold'>Total expense: </b>{totalExpense} RM</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderUsers}
            </div>
        </div>
    );
};

export default WeightSplit;
