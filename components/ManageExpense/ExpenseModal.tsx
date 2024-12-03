import React, {useState} from 'react';
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from "./Button";
import SplitTab from "../Split/SplitTab";
import CreateExpenseForm from "./CreateExpensesForm";
import AddSplit from './AddSplit';
import { useExpense } from '@/context/ExpenseContext';
import { useExpenseList } from '@/context/ExpenseListContext';
import Toast from '../Toast';
interface ExpenseModalProps {
    isOpen: boolean;
    closeModal: () => void;
    refreshAll?: boolean;
    friendId?: string | string[];
    groupId?: string | string[]; 
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ 
    isOpen, 
    closeModal, 
    refreshAll = false,
    friendId, 
    groupId
}) => {
    const { expense, addExpense, deleteExpense, editExpense, resetExpense } = useExpense();
    const { 
        refreshTransactions, 
        refreshGroupTransactions, 
        refreshAllTransactions 
    } = useExpenseList();

    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({
        show: false,
        message: '',
        type: 'success'
    });

    const handleRefresh = async () => {
        const participantIds = Array.from(new Set(
            expense.splitter.map(s => s.id)
            .concat(expense.payer.map(p => p.id))
        )).filter(id => id !== expense.created_by);
    
        const friendIds = friendId 
            ? Array.isArray(friendId) ? friendId : [friendId]
            : [];
            
        const groupIds = groupId
            ? Array.isArray(groupId) ? groupId : [groupId]
            : [];
    
        const allParticipantIds = Array.from(new Set([
            ...participantIds,
            ...friendIds
        ]));
    
        if (refreshAll) {
            await refreshAllTransactions(allParticipantIds, groupIds);
        } else {
            if (groupId) {
                if (Array.isArray(groupId)) {
                    for (const gId of groupId) {
                        await refreshGroupTransactions(gId);
                    }
                } else {
                    await refreshGroupTransactions(groupId);
                }
            }
    
            if (friendId) {
                if (Array.isArray(friendId)) {
                    await refreshAllTransactions(friendId);
                } else {
                    await refreshTransactions(friendId);
                }
            } else if (participantIds.length === 1) {
                await refreshTransactions(participantIds[0]);
            } else if (participantIds.length > 1) {
                await refreshAllTransactions(participantIds);
            }
        }
    };

    const handleCreate = async () => {
        try {
            await addExpense(expense);
            await handleRefresh();
            setToast({
                show: true,
                message: 'Expense created successfully',
                type: 'success'
            });
            closeModal();
        } catch (error) {
            console.log('Error handleCreate: ' + error)
            setToast({
                show: true,
                message: 'Failed to create expense',
                type: 'error'
            });
        }
    };
     
    const handleEdit = async () => {
        try {
            await editExpense(expense);
            await handleRefresh();
            setToast({
                show: true,
                message: 'Expense updated successfully',
                type: 'success'
            });
            closeModal();
        } catch (error) {
            console.log('Error handleEdit: ' + error)
            setToast({
                show: true,
                message: 'Failed to update expense',
                type: 'error'
            });
        }
    };
     
    const handleDelete = async () => {
        if(expense.id){
            try {
                await deleteExpense(expense.id);
                await handleRefresh();
                setToast({
                    show: true,
                    message: 'Expense deleted successfully',
                    type: 'success'
                });
            } catch (error) {
                console.log('Error handleDelete: ' + error)
                setToast({
                    show: true,
                    message: 'Failed to delete expense',
                    type: 'error'
                });
                return;
            }
        }
        closeModal();
    };

    const handleClose = () => {
        resetExpense();
        closeModal();
    };

    return (
        <>
        <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
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
        {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(prev => ({ ...prev, show: false }))}
                />
            )}
        </>
    );
}

export default ExpenseModal;