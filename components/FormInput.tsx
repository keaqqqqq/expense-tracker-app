import React from 'react';
import { Input } from "@headlessui/react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    children?: React.ReactNode;
    className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
    children,
    className = '',
    ...rest
}) => {
    const defaultClassName = "border rounded focus:outline-indigo-500 m-2 p-2 ";

    return (
        <Input className={defaultClassName + className} {...rest}>
            {children}
        </Input>
    );
}

export default FormInput;
