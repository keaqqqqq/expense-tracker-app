'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

interface ButtonProps {
    children?: React.ReactNode; 
    className?: string; 
    disabled?: boolean; 
    redirectPath?: string; 
    clickHandler?: (event: React.MouseEvent<HTMLButtonElement>) => void; 
    text?: React.ReactNode; 
    isLoading?: boolean; 
    type?: "submit" | "button";
    variant?: 'primary' | 'secondary' | 'cancel'; 
}

const Button: React.FC<ButtonProps> = ({
    children,
    className = '',
    disabled = false,
    redirectPath,
    clickHandler,
    text,
    isLoading = false,
    type = "button", 
    variant = 'primary', 
}) => {
    const router = useRouter();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled || isLoading) return; 

        if (clickHandler) {
            clickHandler(event);
        }

        if (redirectPath) {
            router.push(redirectPath); 
        }
    };

    const buttonStyles = {
        primary: 'bg-blue-600 hover:bg-blue-700',
        secondary: 'bg-green-600 hover:bg-green-700',
        cancel: 'bg-slate-500',
    };

    return (
        <button
            onClick={handleClick}
            type={type} 
            className={`w-full py-2 px-4 rounded-md text-white ${disabled || isLoading ? 'bg-gray-400 cursor-not-allowed' : buttonStyles[variant]} ${className}`}
            disabled={disabled || isLoading} 
        >
            {isLoading ? 'Loading...' : text || children} {}
        </button>
    );
};

export default Button;
