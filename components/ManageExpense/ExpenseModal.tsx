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
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            
            {/* Modal container */}
            <div className="fixed inset-0 overflow-y-auto">
                <div className="min-h-full flex items-center justify-center p-4"> {/* Changed to min-h-full and items-center */}
                    <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
                        <DialogTitle className="font-semibold text-sm border-b px-5 py-3">
                            New Expense
                        </DialogTitle>

                        <CreateExpenseForm />

                        <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                            <SplitTab />
                        </div>

                        <div className="px-5 py-2 flex flex-col sm:flex-row font-semibold text-xs text-gray-700 border-b">
                            <div className="flex flex-col w-full mb-2 sm:mb-0 sm:mr-2">
                                within group <FormInput />
                            </div>
                            <div className="flex flex-col w-full">
                                Add split <AddSplit />
                            </div>
                        </div>

                        <div className="bg-gray-100 rounded-b-lg text-xs font-semibold flex justify-end px-2 py-3"> {/* Added py-3 for better padding */}
                            <Button 
                                className="border rounded bg-white mx-1" 
                                onClick={closeModal}
                            >
                                Cancel
                            </Button>
                            <Button 
                                primary 
                                className="mx-1" 
                                onClick={() => { 
                                    createExpenseAPI(expense); 
                                    closeModal(); 
                                }}
                            >
                                Create
                            </Button>
                        </div>
                    </Dialog.Panel>
                </div>
            </div>
        </Dialog>
    );
}

export default ExpenseModal;