import { ReactNode } from 'react';

interface ButtonProps {
    text: ReactNode;
    clickHandler: () => void;
    additionalClasses?: string;
}

const Button: React.FC<ButtonProps> = ({ text, clickHandler, additionalClasses = '' }) => {
    return (
        <button
            onClick={clickHandler}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 bg-indigo-600 text-white hover:bg-indigo-700 ${additionalClasses}`}
        >
            {text}
        </button>
    );
};

export default Button;