'use client'
import React from 'react';
import Button from './ManageExpense/Button';

interface ButtonProps {
    label: string;
    onClick?: () => void;
    primary?: boolean;
    secondary?: boolean;
    homeType?: boolean;
}

interface ManageHeaderProps {
    title: string;
    buttons: ButtonProps[];
    homeType: boolean;
}

const ManageHeader: React.FC<ManageHeaderProps> = ({ title, buttons, homeType }) => {

    return (
        <div className={`${homeType ? '' : 'border rounded'} w-full`}>
            <div className='flex flex-row justify-between font-semibold content-center px-2'>
                <h2 className='my-auto text-md'>{title}</h2>
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
