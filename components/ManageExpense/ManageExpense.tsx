'use client'
import React, { useState } from 'react';
import ManageExpensesHeader from './ManageExpensesHeader';
import Button from './Button';
import ExpensesList from './ExpensesList';
import ExpenseModal from './ExpenseModal';
import TransactionModal from '../Transaction/TransactionModal';
import { useTransaction } from '@/context/TransactionContext';


const ManageExpense: React.FC = () => {
    const buttonClassName = "border rounded text-gray-800 hover:bg-gray-200";
    const [expIsOpen, setExpIsOpen] = useState<boolean>(false);
    const [transIsOpen, setTransIsOpen] = useState<boolean>(false);
    const {setTransaction} = useTransaction();
 

    return (
        <div>
            <ManageExpensesHeader openExpModal={()=>setExpIsOpen(true)} openTransModal={()=>setTransIsOpen(true)} />
            <ExpensesList setIsOpen={setExpIsOpen}/>
            <ExpenseModal isOpen={expIsOpen} closeModal={()=>setExpIsOpen(false)} />
            <TransactionModal isOpen={transIsOpen} closeModal={()=>setTransIsOpen(false)}/>
        </div>
    );
};

export default ManageExpense;
