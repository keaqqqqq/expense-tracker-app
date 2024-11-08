import React, { useEffect, useState } from 'react';
import FormInput from "../FormInput";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setAmount, setCategory, setDate, setDescription } from '@/store/expensesSlice';

const CreateExpenseForm: React.FC = () => {
    const dispatch = useDispatch();
    const expense = useSelector((state: RootState) => state.expenses.expense);

    useEffect(()=>{
        console.log(expense);
    },[expense]);
    return (
        <div className='w-full'>
            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                <div className="flex flex-row">
                    <div className="flex flex-col w-full">
                        <label>Description</label>
                        <FormInput  className="ml-0" value={expense.description} onChange={(e)=>dispatch(setDescription(e.target.value))}/>
                    </div>
                    <div className="flex flex-col">
                        <label>Amount</label>
                        <FormInput className="ml-0" value={expense.amount} onChange={(e)=>dispatch(setAmount(parseFloat(e.target.value) || 0))}/>
                    </div>
                </div>
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        <label>Date</label>
                        <FormInput className="ml-0" value={expense.date} type='date' onChange={(e)=>dispatch(setDate(e.target.value))}/>
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Category</label>
                        <FormInput className="ml-0" value={expense.category} onChange={(e)=>dispatch(setCategory(e.target.value))}/>
                    </div>
                </div>
            </div>
            <div className="px-5 py-2 flex flex-row justify-between font-semibold text-xs text-gray-700 border-b">
                <div>paid by <b className='font-bold'>you</b></div>
                <div >
                    <a className='text-indigo-600 underline cursor-pointer' onClick={()=>console.log("hello")}>
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
