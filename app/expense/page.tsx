'use client';
import React, { useState } from 'react';
import Main from '@/components/Main';
import Button from '@/components/ManageExpense/Button';
import ExpenseModal from '@/components/ManageExpense/ExpenseModal';
import ManageExpensesHeader from '@/components/ManageExpense/ManageExpensesHeader';
import ExpensesList from '@/components/ManageExpense/ExpensesList';
import ProtectedRoute from '@/components/ProtectedRoute';

const ExpensePage: React.FC = () => {
    const buttonClassName = "border rounded text-gray-800 hover:bg-gray-200";
    const [isOpen, setIsOpen] = useState<boolean>(true);

    const openModal = () => {
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    return (
        <ProtectedRoute>
            <ManageExpensesHeader openModal={openModal} />
            <div>
                <Button className={`${buttonClassName} ml-0`}>Expense</Button>
                <Button className={buttonClassName}>Recurring</Button>
                <Button className={buttonClassName}>Uploads</Button>
            </div>
            <ExpensesList />
            <ExpenseModal isOpen={isOpen} closeModal={closeModal} />
        </ProtectedRoute>
    );
};

export default ExpensePage;
