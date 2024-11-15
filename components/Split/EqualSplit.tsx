import { useExpense } from '@/context/ExpenseContext';
import React, { useEffect } from 'react';


const EqualSplit: React.FC = () => {
    const { expense, removeFriendFromSplit , updateFriendAmount} = useExpense(); // Get removeFriendFromSplit from context

    // Function to remove a friend from the split
    const handleRemoveFriend = (friendId: string) => {
        removeFriendFromSplit(friendId); // Call context function to remove the friend
    };


    useEffect(()=>{
        const friendAmount = Number((expense.amount/expense.spliter.length).toFixed(2))
        expense.spliter.map((friend)=>updateFriendAmount(friend.id, friendAmount))
    }, [expense.spliter.length, expense.amount])

    useEffect(()=>{
        console.log(expense.spliter);
    },[expense.spliter])
   
    const renderUsers = expense.spliter.map((user) => {
        return (
            <div className="flex flex-row border rounded" key={user.id}>
                <div className="flex flex-row w-full justify-around content-center">
                    <p className="my-auto">{user.name}</p>
                    <p className="my-auto">{(expense.amount/expense.spliter.length).toFixed(2)}</p>
                </div>
                <button
                    className="w-8 border-l py-2 m-0 text-center hover:bg-gray-100"
                    onClick={() => handleRemoveFriend(user.id)} // Trigger the removal when clicked
                >
                    x
                </button>
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
