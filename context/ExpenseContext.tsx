'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Expense } from '@/types/Expense';
import { SplitFriend } from '@/types/SplitFriend';
import { createExpenseAPI, editExpenseAPI, deleteExpenseAPI, fetchExpensesAPI } from '@/api/expenses';
import { fetchUserData, getGroups, loadFriends } from '@/lib/actions/user.action';
import { Group } from '@/types/Group';
import { useTransaction } from './TransactionContext';
import { useExpenseList } from './ExpenseListContext';

// Define the context state type
interface ExpenseContextType {
    expense: Expense;
    expenses: (Expense & { id: string })[];
    friendList: Omit<SplitFriend, 'amount'>[];
    initialFriendList: Omit<SplitFriend, 'amount'>[];
    groupList: Group[];
    loading: boolean;
    error: string | null;
    userData: Omit<SplitFriend, 'amount'> | null;
    setFriendList: (friendList: Omit<SplitFriend, 'amount'>[]) => void;
    resetExpense: () => void;
    setUserData: (userData: Omit<SplitFriend, 'amount'> | null) => void;
    setExpense: (expense: Omit<Expense, 'id'>) => void;
    setDescription: (description: string) => void;
    setGroup: (group_id: string | '') => void;
    setPayPreference: (pay_preference: string) => void;
    setSplitPreference: (split_preference: string) => void;
    setAmount: (amount: number) => void;
    setSplitData: (data: { id: string, value: number }[]) => void;
    setDate: (date: string) => void;
    setCategory: (category: string) => void;
    setUserId: (userId: string) => void;
    fetchExpenses: (UserId: string) => void;
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    editExpense: (expense: Expense) => void;
    deleteExpense: (id: string) => void;
    addFriendToSplit: (id: string) => void;
    removeFriendFromSplit: (friendId: string) => void;
    addPayer: (id: string) => void;
    removePayer: (friendId: string) => void;
    updateFriendAmount: (friendId: string, amount: number) => void;
    updatePayerAmount: (friendId: string, amount: number) => void;
    createExpenseSplit: (expenseId: string, amount: number) => void;
    setExpenseById: (expenseId: string) => void;
}

// Create the context
const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

interface ExpenseProviderProps {
    children: ReactNode;
}

// Create the provider component
export const ExpenseProvider: React.FC<ExpenseProviderProps> = ({ children }) => {
    const { currentUser } = useAuth(); // Get the currentUser from AuthContext
    const [expenses, setExpenses] = useState<(Expense & { id: string })[]>([]);
    const [friendList, setFriendList] = useState<Omit<SplitFriend, 'amount'>[]>([]);
    const [initialFriendList, setInitialFriendList] = useState<Omit<SplitFriend, 'amount'>[]>([]);
    const [groupList, setGroupList] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [userData, setUserData] = useState<Omit<SplitFriend, 'amount'> | null>(null);
    const [expense, setExpense] = useState<Expense>({

        description: '',
        date: '',
        amount: 0,
        category: '',
        created_at: '',
        created_by: currentUser?.uid || '',  // Set created_by to currentUser.uid
        group_id: '',
        split_preference: '',
        pay_preference: '',
        splitter: [],
        payer: [],
        split_data: [],
    });
    const { refreshAllTransactions, refreshGroupTransactions } = useExpenseList();
    const {calculateTransaction, deleteTransactionsByExpense} = useTransaction();
    const setSplitData = (data: { id: string, value: number }[]) => {
        expense.split_data = data;
    }
    // Fetch expenses from the API
    const fetchExpenses = async (userId: string) => {
        try {
            // Fetch all expenses from the API
            const response = await fetchExpensesAPI();

            // Filter expenses based on the userId in created_by, payer, or splitter
            const filteredExpenses = response.filter(expense => {
                const createdByMatches = expense.created_by === userId;
                const payerMatches = expense.payer?.some(payer => payer.id === userId);
                const splitterMatches = expense.splitter?.some(splitter => splitter.id === userId);

                return createdByMatches || payerMatches || splitterMatches;
            });

            // Sort filtered expenses by date
            setExpenses(filteredExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (err) {
            console.log('Error fetchExpenses: ' + err)
            setError('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };


    const resetExpense = () => {
        if (currentUser?.uid && userData) {
            setExpense({
                description: '',
                date: '',
                amount: 0,
                category: '',
                created_at: '',
                created_by: currentUser?.uid || '',
                group_id: '',
                split_preference: '',
                pay_preference: '',
                splitter: [{
                    id: currentUser.uid,
                    amount: 0
                }],
                payer: [{
                    id: currentUser.uid,
                    amount: 0
                }]
            });

            // Fetch expenses (assuming fetchExpenses is a regular function)
            fetchExpenses(currentUser.uid);
        }
    }
    // Add an expense
    const addExpense = async (newExpense: Omit<Expense, 'id'>) => {
        if (!currentUser?.uid) {
            setError('User is not authenticated');
            return;
        }

        console.log('new expense: ' + JSON.stringify(newExpense))

        try {
            const response = await createExpenseAPI({
                ...newExpense,
                payer: newExpense.payer?.length > 0 ? newExpense.payer : [{
                    id: currentUser.uid,
                    amount: newExpense.amount
                }],
                splitter: newExpense.splitter?.length > 0 ? newExpense.splitter : [{
                    id: currentUser.uid,
                    amount: newExpense.amount
                }],
                created_by: currentUser.uid, // Add the user UID to the created_by field
            });

            await calculateTransaction(response, {
                refreshAllTransactions,
                refreshGroupTransactions
            });           
            fetchExpenses(currentUser.uid);

        } catch (err) {
            console.log('Error addExpenses: ' + err)
            setError('Failed to create expense');
        } finally {
            setLoading(false);
            // Reset expense form to default values
            resetExpense();
        }
    };

    // Edit an expense
    const editExpense = async (updatedExpense: Expense) => {
        if (typeof updatedExpense.id === 'string') {
            try {
                const response = await editExpenseAPI({ ...updatedExpense, id: updatedExpense.id });
                await deleteTransactionsByExpense(updatedExpense.id);

                await calculateTransaction(response, {
                    refreshAllTransactions,
                    refreshGroupTransactions
                });           
                if (currentUser?.uid)
                    fetchExpenses(currentUser.uid); // Re-fetch expenses after editing
            } catch (err) {
                console.log('Error editExpenses: ' + err)
                setError('Failed to edit expense');
            } finally {
                setLoading(false);
                resetExpense();
            }
        }
    };

    // Delete an expense
    const deleteExpense = async (id: string) => {
        console.log("deleting" + id);
        try {
            await deleteExpenseAPI(id);
            await deleteTransactionsByExpense(id);
            if (currentUser)
                fetchExpenses(currentUser.uid); // Re-fetch expenses after deletion
        } catch (err) {
            console.log('Error deleteExpenses: ' + err)
            setError('Failed to delete expense');
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

    const setPayPreference = (pay_preference: string) => {
        setExpense(prev => ({ ...prev, pay_preference }));
    };

    const setSplitPreference = (split_preference: string) => {
        setExpense(prev => ({ ...prev, split_preference }));
    };

    const setAmount = (amount: number) => {
        setExpense(prev => ({ ...prev, amount }));
    };

    const setGroup = (group_id: string | '') => {
        console.log("setting group to id:", group_id);
        setExpense(prev => ({ ...prev, group_id }));
    };

    const setDate = (date: string) => {
        setExpense(prev => ({ ...prev, date }));
    };

    const setCategory = (category: string) => {
        setExpense(prev => ({ ...prev, category }));
    };

    // Split-related functions
    const addFriendToSplit = (id: string) => {
        setExpense(prev => ({
            ...prev,
            splitter: [...prev.splitter, { id, amount: 0 }]
        }));
    };

    const removeFriendFromSplit = (friendId: string) => {
        setExpense(prev => ({
            ...prev,
            splitter: prev.splitter.filter(f => f.id !== friendId)
        }));
    };

    // Payer-related functions
    const addPayer = (id: string) => {
        setExpense(prev => ({
            ...prev,
            payer: [...prev.payer, { id, amount: 0 }] // Initialize payer amount to 0
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
            splitter: prev.splitter.map(friend =>
                friend.id === friendId ? { ...friend, amount: newAmount } : friend
            )
        }));
    };

    const updatePayerAmount = (friendId: string, newAmount: number) => {
        setExpense(prev => ({
            ...prev,
            payer: prev.payer.map(friend =>
                friend.id === friendId ? { ...friend, amount: newAmount } : friend
            )
        }));
    };

    const createExpenseSplit = (expenseId: string, amount: number) => {
        setExpense(prev => ({
            ...prev,
            id: expenseId,
            amount,
            splitter: [],
            payer: []
        }));
    };

    const setExpenseById = (id: string) => {
        const selectedExpense = expenses.find(exp => exp.id === id);
        if (selectedExpense) {
            setExpense(selectedExpense);
        } else {
            setError('Expense not found');
        }
    };
    // Fetch friend list (simulating for now)
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.uid) {
                // Assuming `loadFriends` is an async function
                const friends = await loadFriends(currentUser.uid);
                const newUserData = await fetchUserData(currentUser.uid);
                setUserData({
                    id: currentUser.uid,
                    name: newUserData.name,
                    email: newUserData.email,
                    image: newUserData.image
                });
                const groups = await getGroups(newUserData.email);
                setGroupList(groups);
                setInitialFriendList([...friends, {
                    id: currentUser.uid,
                    name: newUserData.name,
                    email: newUserData.email,
                    image: newUserData.image
                }]);
                setFriendList([...friends, {
                    id: currentUser.uid,
                    name: newUserData.name,
                    email: newUserData.email,
                    image: newUserData.image
                }]);

                setExpense({
                    description: '',
                    date: '',
                    amount: 0,
                    category: '',
                    created_at: '',
                    created_by: currentUser?.uid || '',
                    group_id: '',
                    split_preference: '',
                    pay_preference: '',
                    splitter: [{
                        id: currentUser.uid,
                        amount: 0
                    }],
                    payer: [{
                        id: currentUser.uid,
                        amount: 0
                    }]
                });

                // Fetch expenses (assuming fetchExpenses is a regular function)
                fetchExpenses(currentUser.uid);
            }
        };

        fetchData();
    }, [currentUser]);

    return (
        <ExpenseContext.Provider value={{
            expense,
            expenses,
            friendList,
            initialFriendList,
            groupList,
            loading,
            error,
            userData,
            setFriendList,
            resetExpense,
            setUserData,
            setExpense,
            setGroup,
            setSplitData,
            setDescription,
            setPayPreference,
            setSplitPreference,
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
            updatePayerAmount,
            createExpenseSplit,
            setExpenseById,
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
