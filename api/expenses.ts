// src/api/expenses.ts
import { db } from '@/firebase/config';
import { Expense } from '@/types/Expense';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Define the collection reference
const expensesCollection = collection(db, 'Expenses');

// Fetch expenses from Firestore
export const fetchExpensesAPI = async (): Promise<Expense[]> => {
  const snapshot = await getDocs(expensesCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data() as Omit<Expense, 'id'>; // Omit 'id' from the document data
    return { ...data, id: doc.id}; // Return the document ID along with the data
  });
};

// Create a new expense in Firestore
export const createExpenseAPI = async (expense: Omit<Expense, 'id'>): Promise<Expense> => {
  const docRef = await addDoc(expensesCollection, expense);
  return { id: docRef.id, ...expense }; // Return the created expense with its ID
};

// Edit an existing expense in Firestore
export const editExpenseAPI = async (expense: Expense): Promise<Expense> => {
  const expenseRef = doc(db, 'expenses', expense.id);
  await updateDoc(expenseRef, { // Update the document with the expense data
    amount: expense.amount,
    category: expense.category,
    created_at: expense.created_at,
    date: expense.date,
    description: expense.description,
    group_id: expense.group_id,
    paid_by: expense.paid_by,
    split_preference: expense.split_preference,
  });
  return expense; // Return the updated expense
};

// Delete an expense from Firestore
export const deleteExpenseAPI = async (id: string): Promise<void> => {
  const expenseRef = doc(db, 'expenses', id);
  await deleteDoc(expenseRef); // Call Firestore to delete the document
};
