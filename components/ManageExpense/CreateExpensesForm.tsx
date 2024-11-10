import React, { useEffect } from 'react';
import FormInput from "../FormInput";
// import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useExpense } from '@/context/ExpenseContext';
// import { setAmount, setCategory, setDate, setDescription } from '@/store/expensesSlice';

const CreateExpenseForm: React.FC = () => {
    // const dispatch = use);
    // const expense = useSelector((state: RootState) => state.expenses.expense);
    const {expense, setAmount, setCategory, setDate, setDescription} = useExpense();

    useEffect(() => {
        console.log(expense);
    }, [expense]);

    return (
        <div className='w-full'>
            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                    <div className="flex flex-col w-full">
                        <label>Description</label>
                        <FormInput className="ml-0" value={expense.description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Amount</label>
                        <FormInput className="ml-0" value={expense.amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                    <div className="flex flex-col w-full">
                        <label>Date</label>
                        <FormInput className="ml-0" value={expense.date} type='date' onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Category</label>
                        <FormInput className="ml-0" value={expense.category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="px-5 py-2 flex flex-row justify-between font-semibold text-xs text-gray-700 border-b">
                <div>paid by <b className='font-bold'>you</b></div>
                <div>
                    <a className='text-indigo-600 underline cursor-pointer' onClick={() => console.log("hello")}>
                        Change payer
                    </a>
                    &nbsp;&mdash;&nbsp;
                    <a className='text-indigo-600 underline cursor-pointer'>
                        Add payers
                    </a>
                </div>
            </div>
        </div>
    );
}

export default CreateExpenseForm;
