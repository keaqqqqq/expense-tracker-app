import React from 'react';
import FormInput from '../FormInput';

interface User {
    name: string;
    amount: string;
}

const ManualSplit: React.FC = () => {
    const users: User[] = [
        { name: 'chua', amount: '4.60' },
        { name: 'isyraf', amount: '4.60' },
        { name: 'kiachua', amount: '4.60' },
        { name: 'keachu', amount: '4.60' },
    ];

    const renderUsers = users.map((user) => {
        return (
            <div>
                <div className="flex flex-row border rounded" key={user.name}>
                    <div className="flex flex-row w-full justify-around content-center">
                        <p className="my-auto">{user.name}</p>
                        <p className="my-auto">{user.amount}</p>
                    </div>
                    <p className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100">x</p>
                </div>
                <div className='flex flex-row border rounded my-2'>
                    <p className="border-r p-2 m-0 text-center text-gray-500 font-normal hover:bg-gray-100">Amount</p>
                    <input className='focus:outline-indigo-600 p-2 w-full' type='number'/>
                </div>
            </div>
        );
    });

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                <div>
                    Specify exactly how much each person owes.
                </div>
                <div><b className='font-bold'>Total: </b>{"RM 6.00"}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 my-2">
                {renderUsers}
            </div>
        </div>
    );
};

export default ManualSplit;