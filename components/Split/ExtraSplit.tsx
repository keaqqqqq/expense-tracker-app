import React, { useState } from 'react';
import { SplitInterface } from '@/types/SplitInterface';

interface User {
    name: string;
}

const ExtraSplit: React.FC<SplitInterface> = ({ expense }) => {
    const users: User[] = [
        { name: 'chua' },
        { name: 'isyraf' },
        { name: 'kiachu' },
        { name: 'keachu' },
    ];

    // State to track adjustments for each user
    const [adjustments, setAdjustments] = useState<{ [key: string]: number }>({
        chua: 0,
        isyraf: 0,
        kiachu: 0,
        keachu: 0,
    });

    // Handle adjustment changes
    const handleAdjustmentChange = (userName: string, value: number) => {
        setAdjustments((prev) => ({
            ...prev,
            [userName]: value,
        }));
    };

    // Calculate total adjustments and the remainder
    const totalAdjustments = Object.values(adjustments).reduce((acc, curr) => acc + curr, 0);
    const remainingAmount = expense.amount - totalAdjustments;
    const splitAmount = remainingAmount / users.length;

    const renderUsers = users.map((user) => (
        <div key={user.name}>
            <div className="flex flex-row border rounded my-2">
                <div className="flex flex-row w-full justify-between content-center px-2">
                    <p className="my-auto">{user.name}</p>
                    <p className="my-auto">
                        {((adjustments[user.name] || 0) + splitAmount).toFixed(2)} RM
                    </p>
                </div>
                <p className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100">x</p>
            </div>
            <div className='flex flex-row border rounded my-2'>
                <p className="w-8 border-r py-2 m-0 text-center hover:bg-gray-100">+</p>
                <input
                    className='focus:outline-indigo-600 p-2 w-full'
                    type='number'
                    value={adjustments[user.name]}
                    onChange={(e) => handleAdjustmentChange(user.name, Number(e.target.value))}
                />
            </div>
        </div>
    ));

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>
                    Enter adjustments to reflect who owes extra. Remainder will be split equally.
                </div>
                <div><b className='font-bold'>Total adjustments:</b> RM {totalAdjustments.toFixed(2)}</div>
                <div><b className='font-bold'>Remaining amount to split:</b> RM {remainingAmount.toFixed(2)}</div>
                <div><b className='font-bold'>Amount per user:</b> RM {splitAmount.toFixed(2)}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderUsers}
            </div>
        </div>
    );
};

export default ExtraSplit;
