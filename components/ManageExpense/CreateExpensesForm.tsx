import React, { useEffect } from 'react';
import FormInput from "../FormInput";
import { useExpense } from '@/context/ExpenseContext';
import AddPayer from '../Pay/AddPayer';
import ExpenseCategories from '@/types/ExpenseCategories';
import ExpenseCategoryDisplay from '../ExpenseCategoryDisplay';

interface CreateExpenseFormProps {
    errors: { [key: string]: string };
}

const CreateExpenseForm: React.FC<CreateExpenseFormProps> = ({ errors }) => {
    const { expense, setAmount, setCategory, setDate, setDescription } = useExpense();

    useEffect(() => {
        console.log(expense);
    }, [expense]);

    return (
        <form className='w-full'>
            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                    <div className="flex flex-col w-full">
                        <label>Description</label>
                        <FormInput
                            className="ml-0"
                            value={expense.description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Amount</label>
                        <FormInput
                            className="ml-0"
                            value={expense.amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        />
                        {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-4">
                    <div className="flex flex-col w-full">
                        <label>Date</label>
                        <FormInput
                            className="ml-0"
                            value={expense.date}
                            type="date"
                            onChange={(e) => setDate(e.target.value)}
                        />
                        {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
                    </div>
                    <div className="flex flex-col w-full">
                        <label>Category</label>
                        <select
                            onChange={(e) => setCategory(e.target.value)}
                            value={expense.category}
                            className="text-xs border rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none px-2 py-2.5 my-2 mr-2"
                        >
                            {ExpenseCategories.map((category) => (
                                <option key={category.value} value={category.value}>
                                    <ExpenseCategoryDisplay value={category.value} />
                                </option>
                            ))}
                        </select>
                        {errors.category && <p className="text-red-500 text-xs">{errors.category}</p>}
                    </div>
                </div>
            </div>
            <AddPayer />
            {errors.payer && <p className="text-red-500 text-xs">{errors.payer}</p>}
        </form>
    );
};

export default CreateExpenseForm;
