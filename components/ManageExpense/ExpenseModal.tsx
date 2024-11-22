import React, { useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from "./Button";
import SplitTab from "../Split/SplitTab";
import CreateExpenseForm from "./CreateExpensesForm";
import AddSplit from './AddSplit';
import { useExpense } from '@/context/ExpenseContext';
import { useExpenseList } from '@/context/ExpenseListContext';

interface ExpenseModalProps {
    isOpen: boolean;
    closeModal: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, closeModal }) => {
    const {expense, addExpense, deleteExpense, editExpense, resetExpense} = useExpense();
    const { refreshTransactions, refreshGroupTransactions } = useExpenseList();

    const handleRefresh = async (friendId?: string, groupId?: string) => {
        if (groupId) {
            await refreshGroupTransactions(groupId);
        }
        if (friendId) {
            await refreshTransactions(friendId);
        }
    };

    const getFriendId = () => {
        return expense.splitter.find(s => s.id !== expense.created_by)?.id || 
               expense.payer.find(p => p.id !== expense.created_by)?.id;
    };

    const handleCreate = async () => {
        await addExpense(expense);
        const friendId = getFriendId();
        const groupId = expense.group_id;
        
        await handleRefresh(friendId, groupId);
        closeModal();
    };
     
    const handleEdit = async () => {
        await editExpense(expense);
        const friendId = getFriendId();
        const groupId = expense.group_id;

        await handleRefresh(friendId, groupId);
        closeModal();
    };
     
    const handleDelete = async () => {
        if(expense.id){
            const friendId = getFriendId();
            const groupId = expense.group_id;
            
            await deleteExpense(expense.id);
            await handleRefresh(friendId, groupId);
        }
        closeModal();
    };

    const handleClose = () => {
        resetExpense();
        closeModal();
    };

    return (
        <Dialog open={isOpen} onClose={handleClose} className="relative z-30">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="min-h-full flex items-center justify-center p-4">
                    <DialogPanel className="rounded bg-white my-4 mx-2 sm:mx-0">
                        <DialogTitle className="font-semibold text-sm border-b px-5 py-3">
                            {expense.id ? 'Edit Expense' : 'New Expense'}
                        </DialogTitle>
                        <CreateExpenseForm />

                        <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                            <SplitTab />
                        </div>
                        <div className="px-5 py-2 flex flex-col sm:flex-row font-semibold text-xs text-gray-700 border-b">
                            <AddSplit/>
                        </div>
                        {expense.id ? 
                            <div className='bg-gray-100 rounded-b-lg text-xs font-semibold flex flex-row justify-between'>
                                <Button className='bg-red-500 rounded text-white border border-gray-100' onClick={handleDelete}>Delete</Button>                            
                                <div className="flex justify-end px-2">
                                    <Button className="border rounded bg-white mx-1" onClick={handleClose}>Cancel</Button>
                                    <Button primary className="mx-1" onClick={handleEdit}>Edit</Button>
                                </div>
                            </div> :
                            <div className="bg-gray-100 rounded-b-lg text-xs font-semibold flex justify-end px-2">
                                <Button className="border rounded bg-white mx-1" onClick={handleClose}>Cancel</Button>
                                <Button primary className="mx-1" onClick={handleCreate}>Create</Button>
                            </div>
                        }
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}

export default ExpenseModal;