'use client';
import Main from '@/components/Main'
// import CreateExpenseForm from './components/ManageExpense/ExpenseModal';
import { useState } from 'react';
import Button from '@/components/ManageExpense/Button';
import ExpenseModal from '@/components/ManageExpense/ExpenseModal';
import ManageExpensesHeader from '@/components/ManageExpense/ManageExpensesHeader';
import ExpensesList from '@/components/ManageExpense/ExpensesList';





export default function ExpensePage() {
    const buttonClassName = "border rounded text-gray-800 hover:bg-gray-200";
    const [isOpen, setIsOpen] = useState(true);
    const openModal = () =>{
        setIsOpen(true);
    }
    const closeModal = () =>{
        setIsOpen(false);
    }
    return <Main>
       <ManageExpensesHeader openModal={openModal}></ManageExpensesHeader>
        <div>
            <Button className={buttonClassName+" ml-0"}>Expense</Button>
            <Button className={buttonClassName}>Recurring</Button>
            <Button className={buttonClassName}>Uploads</Button>
        </div>
       <ExpensesList></ExpensesList>
        <ExpenseModal isOpen={isOpen} closeModal={closeModal}></ExpenseModal>
    </Main>
}