import { SplitInterface } from '@/types/SplitInterface';
import React from 'react';

interface User {
    name: string;
}


const EqualSplit: React.FC<SplitInterface> = ({expense}) => {
    const users: User[] = [
        { name: 'chua'},
        { name: 'isyraf'},
        { name: 'kiachua'},
        { name: 'keachu'},
    ];

    const renderUsers = users.map((user) => {
        return (
            <div className="flex flex-row border rounded" key={user.name}>
                <div className="flex flex-row w-full justify-around content-center">
                    <p className="my-auto">{user.name}</p>
                    <p className="my-auto">{expense.amount/users.length}</p>
                </div>
                <p className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100">x</p>
            </div>
        );
    });

    return (
        <div className="my-2">
            <div className="border bg-gray-100 rounded p-1 text-center">
                Select which people owe an equal share
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                {renderUsers}
            </div>
        </div>
    );
};

export default EqualSplit;
