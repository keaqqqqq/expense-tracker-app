import ManageExpense from '@/components/ManageExpense/ManageExpense';
import ProtectedRoute from '@/components/ProtectedRoute';
import React, { useState } from 'react';

const ExpensePage: React.FC = () => {

    return (
        <ProtectedRoute>
            <ManageExpense></ManageExpense>
        </ProtectedRoute>
    );
};

export default ExpensePage;
