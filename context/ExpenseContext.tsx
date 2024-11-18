'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Expense } from '@/types/Expense';
import { SplitFriend } from '@/types/SplitFriend';
import { createExpenseAPI, editExpenseAPI, deleteExpenseAPI, fetchExpensesAPI } from '@/api/expenses';
import { fetchUserData, getGroups, loadFriends } from '@/lib/actions/user.action';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Group } from '@/types/Group';

// Define the context state type
interface ExpenseContextType {
    expense: Expense;
    expenses: (Expense & { id: string })[];
    friendList: Omit<SplitFriend, 'amount'>[];
    groupList: Group[];
    loading: boolean;
    error: string | null;
    userData: Omit<SplitFriend, 'amount'> | null;
    resetExpense: () => void;
    setUserData: (userData: Omit<SplitFriend, 'amount'> | null) => void;
    setExpense: (expense: Omit<Expense, 'id'>) => void;
    setDescription: (description: string) => void;
    setPayPreference: (pay_preference: string) => void;
    setSplitPreference: (split_preference: string) => void;
    setAmount: (amount: number) => void;
    setDate: (date: string) => void;
    setCategory: (category: string) => void;
    setUserId: (userId: string) => void;
    fetchExpenses: (UserId: string) => void;
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    editExpense: (expense: Expense & { id: string }) => void;
    deleteExpense: (id: string) => void;
    addFriendToSplit: (friend: Omit<SplitFriend, 'amount'>) => void;
    removeFriendFromSplit: (friendId: string) => void;
    addPayer: (friend: Omit<SplitFriend, 'amount'>) => void;
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
        payer: []
    });



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
            setError('Failed to fetch expenses');
        } finally {
            setLoading(false);
        }
    };

    //calculate transaction
    // Calculate transaction function
    const calculateTransaction = async (response: Expense) => {
        // Initialize users array from the 'payer' list
        let users = response.payer.map((p) => ({
            id: p.id,
            pay: p.amount,
            split: 0  // Initialize split to 0 for each payer
        }));

        // Update users array for 'splitter' list
        response.splitter.forEach((s) => {
            const userIndex = users.findIndex(user => user.id === s.id);
            if (userIndex !== -1) {
                users[userIndex].split = s.amount;  // Update the split value
            } else {
                // Add user if not found
                users.push({
                    id: s.id,
                    pay: 0,
                    split: s.amount
                });
            }
        });
        console.log(users);

        // Calculate amounts owed for each user
        const usersNet = users
            .map((u) => {
                let amountOwed = u.split - u.pay;
                if (amountOwed !== 0) {
                    return { id: u.id, amountOwed };
                }
                return null; // Return null when no amount is owed
            })
            .filter((item) => item !== null);  // Remove null values

        console.log(usersNet);

        let transaction = [];

        // Step 4: Process each pair of users to determine who owes whom
        for (let i = 0; i < usersNet.length; i++) {
            for (let j = i + 1; j < usersNet.length; j++) {  // j starts from i + 1
                console.log(`Processing: ${usersNet[i].id} and ${usersNet[j].id}`);

                let total = usersNet[i].amountOwed + usersNet[j].amountOwed;

                if (usersNet[i].amountOwed < 0 && usersNet[j].amountOwed > 0) {
                    if (total > 0) {
                        transaction.push({
                            amount: -usersNet[i].amountOwed,
                            payer_id: usersNet[i].id,
                            receiver_id: usersNet[j].id,
                            created_at: serverTimestamp(),  // Firestore's timestamp
                            type: 'testing', // Add a type if needed
                        });
                        usersNet[j].amountOwed = total;
                        usersNet[i].amountOwed = 0;
                    } else if (total < 0) {
                        transaction.push({
                            amount: usersNet[j].amountOwed,
                            payer_id: usersNet[i].id,
                            receiver_id: usersNet[j].id,
                            created_at: serverTimestamp(),
                            type: 'testing',
                        });
                        usersNet[i].amountOwed = total;
                        usersNet[j].amountOwed = 0;
                    } else {
                        transaction.push({
                            amount: usersNet[j].amountOwed,
                            payer_id: usersNet[i].id,
                            receiver_id: usersNet[j].id,
                            created_at: serverTimestamp(),
                            type: 'testing',
                        });
                        usersNet[i].amountOwed = 0;
                        usersNet[j].amountOwed = 0;
                    }
                }

                // Reverse the check: when the second user owes and the first is owed
                else if (usersNet[j].amountOwed < 0 && usersNet[i].amountOwed > 0) {
                    if (total > 0) {
                        transaction.push({
                            amount: -usersNet[j].amountOwed,
                            payer_id: usersNet[j].id,
                            receiver_id: usersNet[i].id,
                            created_at: serverTimestamp(),
                            type: 'testing',
                        });
                        usersNet[i].amountOwed = total;
                        usersNet[j].amountOwed = 0;
                    } else if (total < 0) {
                        transaction.push({
                            amount: usersNet[i].amountOwed,
                            payer_id: usersNet[j].id,
                            receiver_id: usersNet[i].id,
                            created_at: serverTimestamp(),
                            type: 'testing',
                        });
                        usersNet[j].amountOwed = total;
                        usersNet[i].amountOwed = 0;
                    } else {
                        transaction.push({
                            amount: usersNet[i].amountOwed,
                            payer_id: usersNet[j].id,
                            receiver_id: usersNet[i].id,
                            created_at: serverTimestamp(),
                            type: 'testing',
                        });
                        usersNet[i].amountOwed = 0;
                        usersNet[j].amountOwed = 0;
                    }
                }
            }
        }

        // Store the transactions in Firestore
        try {
            for (let trans of transaction) {
                // Store each transaction in the 'Transactions' collection
                await addDoc(collection(db, "Transactions"), {
                    ...trans,
                    expense_id: response.id,  // Optional: If you want to store the response id
                    group_id: response.group_id, // Optional: If you want to store the group id
                });
            }
            console.log("Transactions stored successfully!");
        } catch (error) {
            console.error("Error storing transactions in Firestore:", error);
        }

        console.log(transaction, users);  // Final transaction log
        return transaction;
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
                    name: userData.name,
                    email: userData.email,
                    image: userData.image,
                    amount: 0
                }],
                payer: [{
                    id: currentUser.uid,
                    name: userData.name,
                    email: userData.email,
                    image: userData.image,
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

        // Check if userData is available
        if (!userData) {
            setError('User data is not available');
            return;
        }

        try {
            const response = await createExpenseAPI({
                ...newExpense,
                payer: newExpense.payer?.length > 0 ? newExpense.payer : [{
                    ...userData,
                    amount: newExpense.amount
                }],
                splitter: newExpense.splitter?.length > 0 ? newExpense.splitter : [{
                    ...userData,
                    amount: newExpense.amount
                }],
                created_by: currentUser.uid, // Add the user UID to the created_by field
            });

            calculateTransaction(response);
            // Fetch expenses again to make sure we're up-to-date
            fetchExpenses(currentUser.uid);

        } catch (err) {
            setError('Failed to create expense');
        } finally {
            setLoading(false);
            // Reset expense form to default values
            resetExpense();
        }
    };

    // Edit an expense
    const editExpense = async (updatedExpense: Expense & { id: string }) => {
        try {
            const response = await editExpenseAPI(updatedExpense);

            if (currentUser?.uid)
                fetchExpenses(currentUser.uid); // Re-fetch expenses after editing
        } catch (err) {
            setError('Failed to edit expense');
        } finally {
            setLoading(false);
            resetExpense();
        }
    };

    // Delete an expense
    const deleteExpense = async (id: string) => {
        console.log("deleting" + id);
        try {
            await deleteExpenseAPI(id);
            if (currentUser)
                fetchExpenses(currentUser.uid); // Re-fetch expenses after deletion
        } catch (err) {
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
            splitter: [...prev.splitter, { ...friend, amount: 0 }]
        }));
    };

    const removeFriendFromSplit = (friendId: string) => {
        setExpense(prev => ({
            ...prev,
            splitter: prev.splitter.filter(f => f.id !== friendId)
        }));
    };

    // Payer-related functions
    const addPayer = (friend: Omit<SplitFriend, 'amount'>) => {
        setExpense(prev => ({
            ...prev,
            payer: [...prev.payer, { ...friend, amount: 0 }] // Initialize payer amount to 0
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
                        name: newUserData.name,
                        email: newUserData.email,
                        image: newUserData.image,
                        amount: 0
                    }],
                    payer: [{
                        id: currentUser.uid,
                        name: newUserData.name,
                        email: newUserData.email,
                        image: newUserData.image,
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
            groupList,
            loading,
            error,
            userData,
            resetExpense,
            setUserData,
            setExpense,
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
