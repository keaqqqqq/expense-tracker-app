import React, { useState } from 'react';
import { SplitInterface } from '@/types/SplitInterface';

interface User {
    name: string;
}

const PercentageSplit: React.FC<SplitInterface> = ({ expense }) => {
    
    const users: User[] = [
        { name: 'chua' },
        { name: 'isyraf' },
        { name: 'kiachu' },
        { name: 'keachu' },
        { name: 'hola' },
    ];
    const initialPercentages = users.reduce((acc, user) => {
        acc[user.name] = 0;
        return acc;
    }, {} as { [key: string]: number });
    
    const [percentages, setPercentages] = useState<{ [key: string]: number }>(initialPercentages);
    const totalExpense = expense.amount; // Assuming expense has an amount property
    const totalPercentage = Object.values(percentages).reduce((acc, curr) => acc + curr, 0);
    const underBy = 100 - totalPercentage;

    const handlePercentageChange = (userName: string, value: number) => {
        setPercentages((prev) => ({
            ...prev,
            [userName]: Math.max(0, Math.min(100, value)), // Ensure values are between 0 and 100
        }));
    };

    const renderUsers = users.map((user) => (
        <div key={user.name}>
            <div className="flex flex-row border rounded my-2">
                <div className="flex flex-row w-full justify-between content-center px-2">
                    <p className="my-auto">{user.name}</p>
                    <p className="my-auto">{((percentages[user.name] / 100) * totalExpense).toFixed(2)} RM</p>
                </div>
                <p className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100">x</p>
            </div>
            <div className='flex flex-row border rounded my-2'>
                <p className="w-8 border-r py-2 m-0 text-center hover:bg-gray-100">%</p>
                <input
                    className='focus:outline-indigo-600 p-2 w-full'
                    type='number'
                    value={percentages[user.name]}
                    onChange={(e) => handlePercentageChange(user.name, Number(e.target.value))}
                    min="0"
                    max="100"
                />
            </div>
        </div>
    ));

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>
                    Specify the percentages that are fair for your situation.
                </div>
                <div>Total percentage: {totalPercentage}%</div>
                {totalPercentage < 100 && (
                    <div className='text-red-500 font-bold'>Under by: {underBy}%</div>
                )}
                {totalPercentage > 100 && (
                    <div className='text-red-500 font-bold'>Exceeded by: {totalPercentage - 100}%</div>
                )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderUsers}
            </div>
        </div>
    );
};

export default PercentageSplit;
