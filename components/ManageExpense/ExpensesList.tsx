import { editExpenseAPI, fetchExpensesAPI } from '@/api/expenses';
import { fetchExpenses } from '@/store/expensesSlice';
import { RootState } from '@/store/store';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from './Button';

const ExpensesList: React.FC = () => {
    const {expenses, loading, error} = useSelector((state: RootState) => state.expenses);
    const dispatch = useDispatch();
    useEffect(()=>{
        dispatch(fetchExpenses());
    },[dispatch])
    const renderList = expenses.map((expense, index) => {
        // Check if the date is the same as the previous expense
        const showDate = index === 0 || expense.date !== expenses[index - 1].date;
        
        return (
            <div key={expense.id}>
                {showDate && (
                    <div className={`bg-gray-100 px-2 font-semibold text-gray-600 border ${index == 0 ? 'rounded-t-lg' : ''}`}>
                        {`${expense.date}`}
                    </div>
                )}
                <div className='flex flex-row justify-between font-bold content-center px-2 py-3 border-t'>
                    <div className='text-black'>{expense.description}</div>
                    <div className='text-black'>{`RM ${expense.amount}`} <Button primary onClick={()=>{console.log(expense.id)}}>Edit</Button></div>
                    
                </div>
            </div>
        );
    });
    if(loading) return <div>Loading...</div>
    if(error) return <div>{error}</div>
    return (
        <div className='border rounded-lg'>
            {renderList}
        </div>
    );
};

export default ExpensesList;
