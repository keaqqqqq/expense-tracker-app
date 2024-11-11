import React from 'react';
import Button from "./Button";

interface ManageExpensesHeaderProps {
    openModal: () => void; 
}

const ManageExpensesHeader: React.FC<ManageExpensesHeaderProps> = ({ openModal }) => {
    return (
        <div className='border rounded'>
            <div className='flex flex-row justify-between font-semibold content-center px-2'>
                <h2 className='my-auto'>Expenses</h2>
                <div className='text-sm'>
                    <Button primary className='mx-1' onClick={openModal}>New expense</Button>
                    <Button secondary>Settle up</Button>
                </div>
            </div>
        </div>
    );
};

export default ManageExpensesHeader;
