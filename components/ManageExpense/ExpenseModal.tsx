import React from 'react';
import { Dialog, DialogDescription, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from "./Button";
import FormInput from "../FormInput";
import SplitTab from "./SplitTab";
import CreateExpenseForm from "./CreateExpensesForm";
import { createExpenseAPI } from '@/api/expenses';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

interface ExpenseModalProps {
    isOpen: boolean;
    closeModal: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, closeModal }) => {
    const expense = useSelector((state: RootState) => state.expenses.expense);

    return (
        <Dialog open={isOpen} onClose={closeModal} className="relative z-10">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="max-w rounded bg-white">
                    <DialogTitle className="font-semibold text-sm border-b px-5 py-3 m-0">New Expense</DialogTitle>
                    <CreateExpenseForm />
                    
                    <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                        <SplitTab />
                    </div>
                    <div className="px-5 py-2 flex flex-row font-semibold text-xs text-gray-700 border-b">
                        <div className="flex flex-col">within group <FormInput /></div>
                        <div className="flex flex-col">Add split <FormInput /></div>
                    </div>
                    <div className="bg-gray-100 rounded-b-lg text-xs font-semibold flex justify-end px-2">
                        <Button className="border rounded bg-white mx-1" onClick={closeModal}>Cancel</Button>
                        <Button primary className="mx-1" onClick={()=>{createExpenseAPI(expense); closeModal()}}>Create</Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}

export default ExpenseModal;
