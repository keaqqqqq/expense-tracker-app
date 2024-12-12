'use client'
import React, { useState } from 'react';
import ExpenseList from '../ExpenseList';
import ExpenseModal from './ExpenseModal';
import TransactionModal from '../Transaction/TransactionModal';
import Button from './Button';
interface ManageExpenseProps {
    uid: string;
    friendIds?: string | string[];
    groupIds?: string | string[]; 
    homeType?: boolean;
}

interface ManageButton {
    label: string;
    onClick: () => void;
    primary?: boolean;
    secondary?: boolean;
}

const ManageExpense: React.FC<ManageExpenseProps> = ({ 
    uid, 
    friendIds,
    groupIds,
    homeType = false
}) => {
    const [expIsOpen, setExpIsOpen] = useState<boolean>(false);
    const [transIsOpen, setTransIsOpen] = useState<boolean>(false);

    const buttons: ManageButton[] = [
        {
            label: 'Add expense',
            onClick: () => setExpIsOpen(true),
            primary: true
        },
        {
            label: 'Settle up',
            onClick: () => setTransIsOpen(true),
            secondary: true
        }
    ];

    return (
        <div>
            <div className={`${homeType ? '' : 'border rounded'} w-full`}>
                <div className="flex flex-row justify-between items-center font-semibold sm:p-2">
                    <h2 className="text-sm sm:text-base ml-1">Expenses</h2>
                    <div className="flex flex-row items-center">
                        {buttons.map((button, index) => (
                            <Button 
                                key={index} 
                                primary={button.primary} 
                                secondary={button.secondary} 
                                onClick={button.onClick} 
                                className="sm:mx-1 text-xs sm:text-sm"
                            >
                                {button.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            
            <ExpenseList 
                currentUserId={uid} 
                showAll={true} 
                allExpense={true}
                fromPage="expense"  
            />
            
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
                fromPage="expense"
            />
        </div>
    );
};

export default ManageExpense;