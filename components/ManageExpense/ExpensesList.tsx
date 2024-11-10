import React, { useEffect } from 'react';
import Button from './Button';
import { Edit, Pencil } from 'lucide-react';
import { useExpense } from '@/context/ExpenseContext';

const ExpensesList: React.FC = () => {
    const {expenses, loading, error} = useExpense();

   
    const renderList = expenses.map((expense, index) => {
        // Check if the date is the same as the previous expense
        const showDate = index === 0 || expense.date !== expenses[index - 1].date;

        return (
            <div key={expense.id}>
                {showDate && (
                    <div className={`bg-gray-100 px-2 font-semibold text-gray-600 ${index == 0 ? 'rounded-t-lg' : ''}`}>
                        {`${expense.date}`}
                    </div>
                )}


                <div className={`flex flex-row content-center hover:bg-zinc-50 ` + (showDate || `border-t border-gray-100`)}>
                    <div className='w-full flex flex-row justify-between font-bold content-center px-2 py-3'>
                        <div className='flex flex-row justify-between'>
                            <div className='text-black my-auto '>{expense.description}</div>
                            <div className='rounded-lg py-1 px-1 my-auto mx-2 bg-gray-200 text-xs font-sans text-gray-500'>{expense.category}</div>
                        </div>
                        <div className='flex flex-row'>
                            <div className='h-5 w-5 rounded-full bg-red-500'></div>
                            <div className='text-xs mr-3 font-medium text-black'>
                                {'You'} <span className='font-normal text-gray-500'>paid</span> {`RM${expense.amount}`}
                            </div>
                        </div>
                    </div>
                    <button className='rounded-br-lg flex content-center hover:bg-gray-100 py-auto w-10' onClick={() => { console.log(expense.id) }}>
                        <Pencil className='stroke-1 active:stroke-2 my-auto mx-auto w-5 h-5 font-light text-gray-500'/>
                    </button>
                </div>
            </div>
        );
    });
    if (loading) return <div>Loading...</div>
    if (error) return <div>{error}</div>
    return (
        <div className='border rounded-lg'>
            {renderList}
        </div>
    );
};

export default ExpensesList;
