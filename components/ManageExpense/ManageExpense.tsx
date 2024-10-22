'use client'
import React, { useState } from 'react';
import ProtectedRoute from '../ProtectedRoute';
import ManageExpensesHeader from './ManageExpensesHeader';
import Button from './Button';
import ExpensesList from './ExpensesList';
import ExpenseModal from './ExpenseModal';


const ManageExpense: React.FC = () => {
    const buttonClassName = "border rounded text-gray-800 hover:bg-gray-200";
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const openModal = () => {
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    return (
        <div>
            <ManageExpensesHeader openModal={openModal} />
            <div>
                <Button className={`${buttonClassName} ml-0`}>Expense</Button>
                <Button className={buttonClassName}>Recurring</Button>
                <Button className={buttonClassName}>Uploads</Button>
            </div>
            <ExpensesList />
            <ExpenseModal isOpen={isOpen} closeModal={closeModal} />
        </div>
    );
};

export default ManageExpense;
