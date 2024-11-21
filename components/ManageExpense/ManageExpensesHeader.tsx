import React from 'react';
import Button from "./Button";

interface ManageExpensesHeaderProps {
    openExpModal: () => void; 
    openTransModal: () => void; 
}

const ManageExpensesHeader: React.FC<ManageExpensesHeaderProps> = ({ openExpModal, openTransModal }) => {
    return (
        <div className='border rounded'>
            <div className='flex flex-row justify-between font-semibold content-center px-2'>
                <h2 className='my-auto'>Expenses</h2>
                <div className='text-sm'>
                    <Button primary className='mx-1' onClick={openExpModal}>New expense</Button>
                    <Button secondary onClick={openTransModal}>Settle up</Button>
                </div>
            </div>
        </div>
    );
};

export default ManageExpensesHeader;
