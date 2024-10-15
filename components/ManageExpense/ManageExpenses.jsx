'use client';
import Main from '@/components/Main'
import Button from './Button'
import CreateExpenseForm from './ExpenseModal';
import { useState } from 'react';





export default function ManageExpenses() {
    const buttonClassName = "border rounded text-gray-800 hover:bg-gray-200";
    const [isOpen, setIsOpen] = useState(true);

    const closeModal = () =>{
        setIsOpen(false);
    }
    const openModal = () =>{
        setIsOpen(true);
    }
    return (<div>
        <div className='border rounded'>
            <div className='flex flex-row justify-between font-semibold content-center px-2'>
                <h2 className='my-auto'>
                    Expenses
                </h2>
                <div className='text-sm'>
                    <Button primary className='mx-1' onClick={openModal}>New expense</Button>
                    <Button secondary>Settle up</Button>
                </div>
            </div>
        </div>
        <div>
            <Button className={buttonClassName+" ml-0"}>Expense</Button>
            <Button className={buttonClassName}>Recurring</Button>
            <Button className={buttonClassName}>Uploads</Button>
        </div>
        <div className='border rounded-lg'>
            <div className='bg-gray-100 px-2 font-semibold text-gray-600 border rounded-t-lg'>OCT 10, 2024 . 2</div>
            <div className='flex flex-row justify-between font-semibold content-center px-2 py-3'>
            <div>chu paid you rm399</div>
            <div>chu paid you rm399</div>
            </div>
        </div>
        <CreateExpenseForm isOpen={isOpen} closeModal={closeModal}></CreateExpenseForm>
    </div>)
}