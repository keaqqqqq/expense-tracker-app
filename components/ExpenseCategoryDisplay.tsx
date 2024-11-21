import React from 'react';
import { Utensils, MessageSquare, Shield, Airplay, Home, Zap, Truck, Film, Heart, BookOpen, Activity, Clipboard, Wrench, Laptop, Users, CreditCard, FileText, Gavel, Briefcase, ShoppingCart, ShoppingBag, Dumbbell, Scissors, PawPrint, DollarSign, UserCheck, Coffee, Link, Award, Tags, Package, Package2, Gift, HelpCircle } from 'lucide-react';
import ExpenseCategories from '@/types/ExpenseCategories';
//   import { ExpenseCategory } from './types';


interface ExpenseCategoryDisplayProps {
    // value: ExpenseCategory['value'];
    value: { value: string, label: string }['value'];
}

const getIcon = (categoryValue: string) => {
    switch (categoryValue) {
        case 'fnb':
            return <Utensils className="w-4 h-4 text-blue-500" />;
        case 'travel':
            return <Airplay className="w-4 h-4 text-orange-500" />;
        case 'rent':
            return <Home className="w-4 h-4 text-green-500" />;
        case 'utilities':
            return <Zap className="w-4 h-4 text-yellow-500" />;
        case 'office_supplies':
            return <Clipboard className="w-4 h-4 text-gray-500" />;
        case 'transportation':
            return <Truck className="w-4 h-4 text-red-500" />;
        case 'entertainment':
            return <Film className="w-4 h-4 text-purple-500" />;
        case 'marketing':
            return <Heart className="w-4 h-4 text-indigo-500" />;
        case 'healthcare':
            return <Heart className="w-4 h-4 text-pink-500" />;
        case 'insurance':
            return <Shield className="w-4 h-4 text-teal-500" />;
        case 'education':
            return <BookOpen className="w-4 h-4 text-yellow-600" />;
        case 'subscriptions':
            return <Activity className="w-4 h-4 text-gray-400" />;
        case 'maintenance_repairs':
            return <Wrench className="w-4 h-4 text-gray-500" />;
        case 'technology':
            return <Laptop className="w-4 h-4 text-blue-500" />;
        case 'employee_salaries':
            return <Users className="w-4 h-4 text-indigo-500" />;
        case 'bank_fees':
            return <CreditCard className="w-4 h-4 text-green-500" />;
        case 'taxes':
            return <FileText className="w-4 h-4 text-yellow-600" />;
        case 'legal_fees':
            return <Gavel className="w-4 h-4 text-red-500" />;
        case 'professional_services':
            return <Briefcase className="w-4 h-4 text-gray-700" />;
        case 'charity_donations':
            return <Heart className="w-4 h-4 text-pink-500" />;
        case 'groceries':
            return <ShoppingCart className="w-4 h-4 text-green-400" />;
        case 'dining_out':
            return <Utensils className="w-4 h-4 text-orange-500" />;
        case 'shopping':
            return <ShoppingBag className="w-4 h-4 text-purple-500" />;
        case 'fitness_health':
            return <Dumbbell className="w-4 h-4 text-blue-600" />;
        case 'personal_care':
            return <Scissors className="w-4 h-4 text-teal-500" />;
        case 'pet_care':
            return <PawPrint className="w-4 h-4 text-gray-400" />;
        case 'childcare':
            return <Home className="w-4 h-4 text-yellow-500" />;
        case 'home_improvement':
            return <Home className="w-4 h-4 text-green-700" />;
        case 'salaries_wages':
            return <DollarSign className="w-4 h-4 text-indigo-400" />;
        case 'freelancer_payments':
            return <UserCheck className="w-4 h-4 text-blue-500" />;
        case 'client_meals':
            return <Coffee className="w-4 h-4 text-brown-500" />;
        case 'networking':
            return <Link className="w-4 h-4 text-gray-600" />;
        case 'conference_fees':
            return <Award className="w-4 h-4 text-yellow-500" />;
        case 'advertising':
            return <Tags className="w-4 h-4 text-green-600" />;
        case 'sales_commissions':
            return <Package className="w-4 h-4 text-orange-600" />;
        case 'product_development':
            return <Package2 className="w-4 h-4 text-blue-600" />;
        case 'gifts_donations':
            return <Gift className="w-4 h-4 text-purple-600" />;
        case 'miscellaneous_expenses':
            return <HelpCircle className="w-4 h-4 text-gray-500" />;
        case 'contingency_fund':
            return <Shield className="w-4 h-4 text-teal-500" />;
        default:
            return 'null';
    }
};

export const ExpenseCategoryDisplay: React.FC<ExpenseCategoryDisplayProps> = ({ value }) => {
    const category = ExpenseCategories.find(cat => cat.value === value);

    if (!category) return value;

    return (
        <div className="flex items-center gap-2 p-2">
            {getIcon(value)}
            <span className="font-medium">{category.label}</span>
        </div>
    );
};

interface ExpenseCategoryListProps {
    className?: string;
}

export const ExpenseCategoryList: React.FC<ExpenseCategoryListProps> = ({ className }) => {
    return (
        <div className={`space-y-2 ${className || ''}`}>
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