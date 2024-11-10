// src/context/ExpenseContext.tsx
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Expense } from '@/types/Expense';
import { SplitFriend } from '@/types/SplitFriend';
import { createExpenseAPI, editExpenseAPI, deleteExpenseAPI, fetchExpensesAPI } from '@/api/expenses';

// Define the context state type
interface ExpenseContextType {
    expense: Omit<Expense, 'id'>;
    expenses: Expense[];
    friendList: Omit<SplitFriend, 'amount'>[];
    loading: boolean;
    error: string | null;
    setExpense: (expense: Omit<Expense, 'id'>) => void;
    setDescription: (description: string) => void;
    setAmount: (amount: number) => void;
    setDate: (date: string) => void;
    setCategory: (category: string) => void;
    setUserId: (userId: string) => void;
    fetchExpenses: () => void;
    addExpense: (expense: Expense) => void;
    editExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;
    addFriendToSplit: (friend: Omit<SplitFriend, 'amount'>) => void;
    removeFriendFromSplit: (friendId: string) => void;
    addPayer: (friend: SplitFriend) => void;
    removePayer: (friendId: string) => void;
    updateFriendAmount: (friendId: string, amount: number) => void;
    createExpenseSplit: (expenseId: string, amount: number) => void;
}

// Create the context
const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

interface ExpenseProviderProps {
    children: ReactNode;
}

// Create the provider component
export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
    const { currentUser } = useAuth(); // Get the currentUser from AuthContext
    const [expense, setExpense] = useState<Omit<Expense, 'id'>>({
        description: '',
        date: '',
        amount: 0,
        category: '',
        created_at: '',
        created_by: currentUser?.uid || '',  // Set created_by to currentUser.uid
        group_id: '',
        split_preference: '',
        spliter: [],
        payer: []
    });
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [friendList, setFriendList] = useState<Omit<SplitFriend, 'amount'>[]>([]); // List of available friends
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch expenses from the API
    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await fetchExpensesAPI();
            setExpenses(response.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (err) {
            setError('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };

    // Add an expense
    const addExpense = async (newExpense: Expense) => {
        if (!currentUser?.uid) {
            setError('User is not authenticated');
            return;
        }
        try {
            setLoading(true);
            const response = await createExpenseAPI({
                ...newExpense,
                created_by: currentUser.uid, // Add the user UID to the created_by field
            });
            setExpenses(prev => [...prev, response]);
            // Fetch expenses again to make sure we're up-to-date
            fetchExpenses(); // Re-fetch expenses after creating
        } catch (err) {
            setError('Failed to create expense');
        } finally {
            setLoading(false);
            setExpense( {
                description: '',
                date: '',
                amount: 0,
                category: '',
                created_at: '',
                created_by: currentUser?.uid || '',  // Set created_by to currentUser.uid
                group_id: '',
                split_preference: '',
                spliter: [],
                payer: []});
        }
    };

    // Edit an expense
    const editExpense = async (updatedExpense: Expense) => {
        try {
            setLoading(true);
            const response = await editExpenseAPI(updatedExpense);
            setExpenses(prev => prev.map(exp => (exp.id === response.id ? response : exp)));
            // Re-fetch the updated expenses
            fetchExpenses(); // Re-fetch expenses after editing
        } catch (err) {
            setError('Failed to edit expense');
        } finally {
            setLoading(false);
        }
    };

    // Delete an expense
    const deleteExpense = async (id: string) => {
        try {
            setLoading(true);
            await deleteExpenseAPI(id);
            setExpenses(prev => prev.filter(exp => exp.id !== id));
            // Re-fetch expenses after deletion
            fetchExpenses(); // Re-fetch expenses after deletion
        } catch (err) {
            setError('Failed to delete expense');
        } finally {
            setLoading(false);
        }
    };

    // Set user ID for paid_by field
    const setUserId = (userId: string) => {
        setExpense(prev => ({ ...prev, paid_by: userId }));
    };

    // Setter functions for individual fields
    const setDescription = (description: string) => {
        setExpense(prev => ({ ...prev, description }));
    };

    const setAmount = (amount: number) => {
        setExpense(prev => ({ ...prev, amount }));
    };

    const setDate = (date: string) => {
        setExpense(prev => ({ ...prev, date }));
    };

    const setCategory = (category: string) => {
        setExpense(prev => ({ ...prev, category }));
    };

    // Split-related functions
    const addFriendToSplit = (friend: Omit<SplitFriend, 'amount'>) => {
        setExpense(prev => ({
            ...prev,
            spliter: [...prev.spliter, { ...friend, amount: 0 }]
        }));
    };

    const removeFriendFromSplit = (friendId: string) => {
        setExpense(prev => ({
            ...prev,
            spliter: prev.spliter.filter(f => f.id !== friendId)
        }));
    };

    const addPayer = (friend: SplitFriend) => {
        setExpense(prev => ({
            ...prev,
            payer: [...prev.payer, friend]
        }));
    };

    const removePayer = (friendId: string) => {
        setExpense(prev => ({
            ...prev,
            payer: prev.payer.filter(f => f.id !== friendId)
        }));
    };

    const updateFriendAmount = (friendId: string, newAmount: number) => {
        setExpense(prev => ({
            ...prev,
            spliter: prev.spliter.map(friend => 
                friend.id === friendId ? { ...friend, amount: newAmount } : friend
            )
        }));
    };

    const createExpenseSplit = (expenseId: string, amount: number) => {
        setExpense(prev => ({
            ...prev,
            id: expenseId,
            amount,
            spliter: [],
            payer: []
        }));
    };

    // Fetch friend list (simulating for now)
    useEffect(() => {
        if (currentUser?.uid) {
            setFriendList([
                { id: '1', name: 'John Doe', email: 'john@example.com' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
                { id: '3', name: 'Sara Lee', email: 'sara@example.com' },
            ]);

            fetchExpenses();
        }
    }, [currentUser]);

    return (
        <ExpenseContext.Provider value={{
            expense,
            expenses,
            friendList,
            loading,
            error,
            setExpense,
            setDescription,
            setAmount,
            setDate,
            setCategory,
            setUserId,
            fetchExpenses,
            addExpense,
            editExpense,
            deleteExpense,
            addFriendToSplit,
            removeFriendFromSplit,
            addPayer,
            removePayer,
            updateFriendAmount,
            createExpenseSplit,
        }}>
            {children}
        </ExpenseContext.Provider>
    );
};

// Custom hook to use the ExpenseContext
export const useExpense = (): ExpenseContextType => {
    const context = useContext(ExpenseContext);
    if (!context) {
        throw new Error('useExpense must be used within an ExpenseProvider');
    }
    return context;
};
