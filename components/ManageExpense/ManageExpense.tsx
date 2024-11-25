'use client'
import React, { useState } from 'react';
import ManageExpensesHeader from './ManageExpensesHeader';
import ExpenseList from '../ExpenseList';
import ExpenseModal from './ExpenseModal';
import TransactionModal from '../Transaction/TransactionModal';

interface ManageExpenseProps {
    uid: string;
    friendIds?: string | string[];
    groupIds?: string | string[]; 
}

const ManageExpense: React.FC<ManageExpenseProps> = ({ 
    uid, 
    friendIds,
    groupIds, 
    
}) => {
    const [expIsOpen, setExpIsOpen] = useState<boolean>(false);
    const [transIsOpen, setTransIsOpen] = useState<boolean>(false);

    return (
        <div>
            <ManageExpensesHeader 
                openExpModal={() => setExpIsOpen(true)} 
                openTransModal={() => setTransIsOpen(true)} 
            />
            <ExpenseList currentUserId={uid} showAll={true} />
            <ExpenseModal 
                isOpen={expIsOpen} 
                closeModal={() => setExpIsOpen(false)} 
                friendId={friendIds}
                refreshAll={true}
                groupId={groupIds} 
            />
            <TransactionModal 
                isOpen={transIsOpen} 
                closeModal={() => setTransIsOpen(false)}
            />
        </div>
    );
};

export default ManageExpense;