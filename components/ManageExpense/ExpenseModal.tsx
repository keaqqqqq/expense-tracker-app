import React from 'react';
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from "./Button";
import FormInput from "../FormInput";
import SplitTab from "../Split/SplitTab";
import CreateExpenseForm from "./CreateExpensesForm";
import { createExpenseAPI } from '@/api/expenses';
import AddSplit from './AddSplit';
import { useExpense } from '@/context/ExpenseContext';


interface ExpenseModalProps {
    isOpen: boolean;
    closeModal: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ isOpen, closeModal }) => {
    const {expense} = useExpense();
    return (

        <Dialog open={isOpen} onClose={closeModal} className="relative z-30">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex items-start justify-center p-4 h-full">
                    <div className="flex flex-col justify-start max-w-3xl w-full"> {/* Wrapper for spacing */}
                        <DialogPanel className="rounded bg-white my-4 mx-2 sm:mx-0"> {/* Only margin at top/bottom */}

                            <DialogTitle className="font-semibold text-sm border-b px-5 py-3">New Expense</DialogTitle>
                            <CreateExpenseForm />

                            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                                <SplitTab />
                            </div>
                            <div className="px-5 py-2 flex flex-col sm:flex-row font-semibold text-xs text-gray-700 border-b">
                                <div className="flex flex-col w-full mb-2 sm:mb-0 sm:mr-2"> {/* Spacing for small screens */}
                                    within group <FormInput />
                                </div>
                                <div className="flex flex-col w-full"> 
                                    Add split <AddSplit />
                                </div>
                            </div>
                            <div className="bg-gray-100 rounded-b-lg text-xs font-semibold flex justify-end px-2">
                                <Button className="border rounded bg-white mx-1" onClick={closeModal}>Cancel</Button>
                                <Button primary className="mx-1" onClick={() => { createExpenseAPI(expense); closeModal(); }}>Create</Button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}

export default ExpenseModal;
