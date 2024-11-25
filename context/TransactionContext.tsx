'use client'
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Expense } from "@/types/Expense";
import { Group } from "@/types/Group";
import { SplitFriend } from "@/types/SplitFriend";
import { Transaction } from '@/types/Transaction';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

// Define the context type based on your provided interface
interface TransactionContextType {
    transaction: Transaction | null;
    friendList: Omit<SplitFriend, 'amount'>[];
    groupList: Group[];
    setTransaction: (transaction: Transaction| null) => void;
    updateGroupList: (friendId?: string, expenseId?: string) => void;
    createTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    editTransaction: (transaction: Transaction) => void;
}

// Define the props for the provider, which will accept `children` of type `React.ReactNode`
interface TransactionProviderProps {
    children: React.ReactNode;
}

// Create the context
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Transaction Context Provider
export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
    // State to store the current transaction, friend list, and group list
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [friendList, setFriendList] = useState<Omit<SplitFriend, 'amount'>[]>([]);
    const [groupList, setGroupList] = useState<Group[]>([]);

    // Method to update the group list (could involve logic such as adding/removing friends from groups)
    const updateGroupList = useCallback((friendId?: string, expenseId?: string) => {
        // Example logic to modify the group list (you would replace this with actual logic)
        if (friendId && expenseId) {
            // Perform group list update based on friendId and expenseId (this is just an example)
            console.log(`Updating group list with friendId: ${friendId} and expenseId: ${expenseId}`);
        } else {
            // Default action or logic for updating the group list
            console.log('Updating group list');
        }
    }, []);

    
    // Method to create a new transaction (you could integrate with a database or API here)
    const createTransaction = async (newTransaction: Omit<Transaction,'id'>) =>{
        // Perform the logic to create a transaction (e.g., add to Firebase, update state)
        console.log('Creating new transaction:', newTransaction);

        await addDoc(collection(db, "Transactions"), newTransaction);
        await updateUserBalance(newTransaction.payer_id, newTransaction.receiver_id, newTransaction.amount);
        setTransaction(null);
    }

    const updateUserBalance = async (payerId: string, receiverId: string, amount: number) => {
        try {
            console.log("updating user balance")
            // Get payer and receiver user documents
            const payerRef = doc(db, "Users", payerId);
            const receiverRef = doc(db, "Users", receiverId);
    
            // Update the payer's balance (subtract the amount they paid)
            const payerSnapshot = await getDoc(payerRef);
            if (payerSnapshot.exists()) {
            console.log("updating payer balance")

                const payerData = payerSnapshot.data();
                const payerBalances: {id:string, balance:number}[] = payerData?.balances || []; // Ensure payerBalances is typed as Balance[]
                if (payerBalances) {
                    // Check if the balances array exists and if the payer already has a balance entry
                    const payerBalanceIndex = payerBalances.findIndex(balance => balance.id === receiverId);
                
                    if (payerBalanceIndex !== -1) {
                        // If payer balance exists, subtract the amount
                        payerBalances[payerBalanceIndex].balance += amount;
                    } else {
                        // If payer balance does not exist, create a new balance entry
                        payerBalances.push({
                            id: receiverId,  // The payer ID
                            balance: amount  // Initialize the balance with the deducted amount
                        });
                    }
                
                    // Now, update the document with the new balances array
                    await updateDoc(payerRef, { balances: payerBalances });
                    console.log(payerBalances);
                    console.log(`Payer's balance updated for user ${payerId}`);
                } else {
                    // If the payerBalances array doesn't exist at all, create it
                    const newBalance = [{
                        id: receiverId,  // The payer ID
                        balance: amount  // Initialize the balance with the deducted amount
                    }];
                    
                    // Create a new balances array and update the document
                    await updateDoc(payerRef, { balances: newBalance });
                    console.log(newBalance);
                    console.log(`Payer's balance created for user ${payerId}`);
                }
                
            }
    
            // Update the receiver's balance (add the amount they received)
            const receiverSnapshot = await getDoc(receiverRef);
            if (receiverSnapshot.exists()) {
                console.log("updating receiver balance")
    
                    const receiverData = receiverSnapshot.data();
                    const receiverBalances: {id:string, balance:number}[] = receiverData?.balances || []; // Ensure receiverBalances is typed as Balance[]
                    if (receiverBalances) {
                        // Check if the balances array exists and if the receiver already has a balance entry
                        const receiverBalanceIndex = receiverBalances.findIndex(balance => balance.id === payerId);
                    
                        if (receiverBalanceIndex !== -1) {
                            // If receiver balance exists, subtract the amount
                            receiverBalances[receiverBalanceIndex].balance -= amount;
                        } else {
                            // If receiver balance does not exist, create a new balance entry
                            receiverBalances.push({
                                id: payerId,  // The receiver ID
                                balance: -amount  // Initialize the balance with the deducted amount
                            });
                        }
                    
                        // Now, update the document with the new balances array
                        await updateDoc(receiverRef, { balances: receiverBalances });
                        console.log(receiverBalances)
                        console.log(`receiver's balance updated for user ${receiverId}`);
                    } else {
                        // If the receiverBalances array doesn't exist at all, create it
                        const newBalance = [{
                            id: payerId,  // The receiver ID
                            balance: -amount  // Initialize the balance with the deducted amount
                        }];
                        
                        // Create a new balances array and update the document
                        await updateDoc(receiverRef, { balances: newBalance });
                        console.log(newBalance);
                        console.log(`receiver's balance created for user ${receiverId}`);
                    }
                    
                }
            console.log("done updating");

    
        } catch (error) {
            console.error("Error updating user balances:", error);
        }
    };

    // Method to edit an existing transaction
    const editTransaction = async (updatedTransaction: Transaction) => {
        // Update the transaction in Firestore
        console.log('Editing transaction:', updatedTransaction);
        
        if (!updatedTransaction.id) {
            console.error('Transaction ID is required for editing');
            return;
        }
    
        const transactionRef = doc(db, "Transactions", updatedTransaction.id);
        const transaction = (await getDoc(transactionRef)).data();
        await updateUserBalance(transaction?.payer_id, transaction?.receiver_id, -transaction?.amount);
        
        try {
            // Update the document in Firestore
            await updateDoc(transactionRef, {
                amount: updatedTransaction.amount,
                created_at: updatedTransaction.created_at,
                expense_id: updatedTransaction.expense_id,
                group_id: updatedTransaction.group_id,
                payer_id: updatedTransaction.payer_id,
                receiver_id: updatedTransaction.receiver_id,
                type: updatedTransaction.type,
            });
            
            // Update local state
            setTransaction(updatedTransaction);
            
            // If the payer or amount changed, update user balances
            // This might require additional logic to handle the previous transaction's impact
            await updateUserBalance(
                updatedTransaction.payer_id, 
                updatedTransaction.receiver_id, 
                updatedTransaction.amount
            );
        } catch (error) {
            console.error('Error updating transaction:', error);
            // Optionally, handle the error (show toast, set error state, etc.)
        }
        setTransaction(null);
    };

    // Return the provider with the context value
    return (
        <TransactionContext.Provider
            value={{
                transaction,
                friendList,
                groupList,
                setTransaction,
                updateGroupList,
                createTransaction,
                editTransaction
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
};

// Custom hook to access the transaction context
export const useTransaction = (): TransactionContextType => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error("useTransaction must be used within a TransactionProvider");
    }
    return context;
};
