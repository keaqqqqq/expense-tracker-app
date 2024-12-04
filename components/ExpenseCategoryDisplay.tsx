import React from 'react';
import ExpenseCategories from '@/types/ExpenseCategories';

interface ExpenseCategoryDisplayProps {
    value: { value: string, label: string }['value'];
}

const getIcon = (categoryValue: string) => {
    // Map category values to emojis
    const emojiMap: { [key: string]: string } = {
        fnb: '🍽️', // from Unicode emoji characters
        travel: '✈️',
        rent: '🏠',
        utilities: '⚡',
        office_supplies: '📎',
        transportation: '🚗',
        entertainment: '🎬',
        marketing: '📢',
        healthcare: '⚕️',
        insurance: '🛡️',
        education: '📚',
        subscriptions: '📱',
        maintenance_repairs: '🔧',
        technology: '💻',
        employee_salaries: '👥',
        bank_fees: '🏦',
        taxes: '📋',
        legal_fees: '⚖️',
        professional_services: '👔',
        charity_donations: '🎗️',
        groceries: '🛒',
        dining_out: '🍳',
        shopping: '🛍️',
        fitness_health: '💪',
        personal_care: '✂️',
        pet_care: '🐾',
        childcare: '👶',
        home_improvement: '🏡',
        salaries_wages: '💰',
        freelancer_payments: '👨‍💻',
        client_meals: '☕',
        networking: '🤝',
        conference_fees: '🎯',
        advertising: '📣',
        sales_commissions: '🎉',
        product_development: '⚙️',
        gifts_donations: '🎁',
        miscellaneous_expenses: '📌',
        contingency_fund: '🔒'
    };

    return (
        <span className="text-xs" role="img" aria-label={categoryValue}>
            {emojiMap[categoryValue] || '📍'}
        </span>
    );
};

export const ExpenseCategoryDisplay: React.FC<ExpenseCategoryDisplayProps> = ({ value }) => {
    const category = ExpenseCategories.find(cat => cat.value === value);

    if (!category) return value;

    return (
        <div className="flex items-center gap-1 cursor-pointer">
            {getIcon(value)}
            <span className="text-xs text-gray-700"> {category.label}</span>
        </div>
    );
};

interface ExpenseCategoryListProps {
    className?: string;
}

export const ExpenseCategoryList: React.FC<ExpenseCategoryListProps> = ({ className }) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ${className || ''}`}>
            {ExpenseCategories.map(category => (
                <ExpenseCategoryDisplay
                    key={category.value}
                    value={category.value}
                />
            ))}
        </div>
    );
};

export default ExpenseCategoryDisplay;