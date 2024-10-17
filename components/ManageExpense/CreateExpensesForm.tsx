import React from 'react';
import FormInput from "../FormInput";

const CreateExpenseForm: React.FC = () => {
    return (
        <>
            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        <label>Description</label>
                        <FormInput className="ml-0" />
                    </div>
                    <div className="flex flex-col">
                        <label>Amount</label>
                        <FormInput className="ml-0" />
                    </div>
                </div>
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        <label>Date</label>
                        <FormInput className="ml-0" />
                    </div>
                    <div className="flex flex-col">
                        <label>Category</label>
                        <FormInput className="ml-0" />
                    </div>
                </div>
            </div>
            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
                pay by who
            </div>
        </>
    );
}

export default CreateExpenseForm;
