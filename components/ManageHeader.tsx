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
        <div className={`border rounded w-full bg-white`}>
            <div className='flex flex-row justify-between items-center font-semibold sm:p-2'>
                <h2 className='text-sm sm:text-base ml-1'>{title}</h2>
                <div className='flex flex-row items-center'>
                    {buttons.map((button, index) => (
                        <Button 
                            key={index} 
                            primary={button.primary} 
                            secondary={button.secondary} 
                            onClick={button.onClick} 
                            className=' sm:mx-1 text-xs sm:text-sm'
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