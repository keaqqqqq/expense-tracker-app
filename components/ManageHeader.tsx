import React from 'react';
import Button from './ManageExpense/Button';

interface ButtonProps {
    label: string;
    onClick?: () => void;
    primary?: boolean;
    secondary?: boolean;
}

interface ManageHeaderProps {
    title: string;
    buttons: ButtonProps[];
}

const ManageHeader: React.FC<ManageHeaderProps> = ({ title, buttons }) => {
    return (
        <div className='border rounded'>
            <div className='flex flex-row justify-between font-semibold content-center px-2'>
                <h2 className='my-auto'>{title}</h2>
                <div className='text-sm'>
                    {buttons.map((button, index) => (
                        <Button 
                            key={index} 
                            primary={button.primary} 
                            secondary={button.secondary} 
                            onClick={button.onClick} 
                            className='mx-1'
                        >
                            {button.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageHeader;
