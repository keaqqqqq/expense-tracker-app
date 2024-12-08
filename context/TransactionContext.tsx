'use client'
import React, { createContext, useContext, useState } from 'react';
import { Expense } from "@/types/Expense";
import { Transaction } from '@/types/Transaction';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
// Define the context type based on your provided interface
interface TransactionContextType {
    transaction: Transaction | null;
    deleteTransactionsByExpense: (expenseId: string) => void;
    calculateTransaction: (
        response: Expense,
        refreshFunctions: {
            refreshAllTransactions: (friendIds?: string[], groupIds?: string[]) => Promise<void>;
            refreshGroupTransactions: (groupId: string) => Promise<void>;
        }
    ) => Promise<{
        amount: number;
        payer_id: string;
        receiver_id: string;
        created_at: string;
        type: string;
    }[]>;
    setTransaction: (transaction: Transaction | null) => void;
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

    // Method to create a new transaction (you could integrate with a database or API here)
    const createTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
        // Perform the logic to create a transaction (e.g., add to Firebase, update state)
        console.log('Creating new transaction:', newTransaction);

        await addDoc(collection(db, "Transactions"), { ...newTransaction, group_id: newTransaction.group_id || "" });
        // await updateUserBalance(newTransaction.payer_id, newTransaction.receiver_id, newTransaction.amount);
        if (newTransaction.group_id && newTransaction.group_id !== "") {
            await updateGroupBalance(newTransaction.payer_id, newTransaction.receiver_id, newTransaction.group_id, newTransaction.amount);
        } else {
            await updateUserBalance(newTransaction.payer_id, newTransaction.receiver_id, newTransaction.amount);
        }
        setTransaction(null);
    }

    const checkFriend = async (uid: string, receiverId: string): Promise<void> => {
        try {
            // Query for existing friendship in both directions
            const [requesterSnapshot, addresseeSnapshot] = await Promise.all([
                getDocs(query(
                    collection(db, 'Friendships'),
                    where('requester_id', '==', uid),
                    where('addressee_id', '==', receiverId)
                )),
                getDocs(query(
                    collection(db, 'Friendships'),
                    where('requester_id', '==', receiverId),
                    where('addressee_id', '==', uid)
                ))
            ]);

            // Check if friendship exists
            const existingFriendship = requesterSnapshot.docs[0] || addresseeSnapshot.docs[0];

            if (existingFriendship) {
                // If friendship exists but not accepted, update it
                const friendshipData = existingFriendship.data();
                if (friendshipData.status !== 'ACCEPTED') {
                    await updateDoc(doc(db, 'Friendships', existingFriendship.id), {
                        status: 'ACCEPTED',
                        updated_at: serverTimestamp()
                    });
                    console.log('Updated existing friendship to ACCEPTED');
                } else {
                    console.log('Friendship already ACCEPTED, no action needed');
                }
            } else {
                // Create new friendship with ACCEPTED status
                await addDoc(collection(db, 'Friendships'), {
                    requester_id: uid,
                    addressee_id: receiverId,
                    status: 'ACCEPTED',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                // window.location.reload(); 
                console.log('Created new ACCEPTED friendship');
            }

        } catch (error) {
            console.error('Error in checkFriend:', error);
            throw error;
        }
    };

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
                const payerBalances: { id: string, balance: number }[] = payerData?.balances || []; // Ensure payerBalances is typed as Balance[]
                if (payerBalances) {
                    // Check if the balances array exists and if the payer already has a balance entry
                    const payerBalanceIndex = payerBalances.findIndex(balance => balance.id === receiverId);

                    if (payerBalanceIndex !== -1) {
                        // If payer balance exists, subtract the amount
                        payerBalances[payerBalanceIndex].balance += amount;
                        console.log("updating balance")
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
                const receiverBalances: { id: string, balance: number }[] = receiverData?.balances || []; // Ensure receiverBalances is typed as Balance[]
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

    const updateGroupBalance = async (payerId: string, receiverId: string, groupId: string, amount: number) => {
        try {
            console.log("updating group balance");
            // Get group document reference
            const groupRef = doc(db, "Groups", groupId);
            const groupSnapshot = await getDoc(groupRef);

            // If group doesn't exist, throw error
            if (!groupSnapshot.exists()) {
                throw new Error(`Group ${groupId} does not exist`);
            }

            const groupData = groupSnapshot.data();
            const members: { id: string, balances: { id: string, balance: number }[] }[] = groupData?.members || [];

            // Find payer and receiver in group members
            const payerMember = members.find(member => member.id === payerId);
            const receiverMember = members.find(member => member.id === receiverId);

            // If either payer or receiver is not in the group, update user balance instead
            if (!payerMember || !receiverMember) {
                console.log("Either payer or receiver not in group, updating user balance instead");
                await updateUserBalance(payerId, receiverId, amount);
                return;
            }

            // Update payer's balance in group
            if (!payerMember.balances) {
                payerMember.balances = [];
            }

            const payerBalanceIndex = payerMember.balances.findIndex(balance => balance.id === receiverId);
            if (payerBalanceIndex !== -1) {
                // If balance exists, update it
                payerMember.balances[payerBalanceIndex].balance += amount;
            } else {
                // If balance doesn't exist, create new entry
                payerMember.balances.push({
                    id: receiverId,
                    balance: amount
                });
            }

            // Update receiver's balance in group
            if (!receiverMember.balances) {
                receiverMember.balances = [];
            }

            const receiverBalanceIndex = receiverMember.balances.findIndex(balance => balance.id === payerId);
            if (receiverBalanceIndex !== -1) {
                // If balance exists, update it
                receiverMember.balances[receiverBalanceIndex].balance -= amount;
            } else {
                // If balance doesn't exist, create new entry
                receiverMember.balances.push({
                    id: payerId,
                    balance: -amount
                });
            }

            // Update the group document with new member balances
            const updatedMembers = members.map(member => {
                if (member.id === payerId) return payerMember;
                if (member.id === receiverId) return receiverMember;
                return member;
            });

            await updateDoc(groupRef, { members: updatedMembers });
            console.log("Group balances updated successfully");

        } catch (error) {
            console.error("Error updating group balances:", error);
            throw error;
        }
    };

    const calculateTransaction = async (response: Expense, refreshFunctions: {
        refreshAllTransactions: (friendIds?: string[], groupIds?: string[]) => Promise<void>;
        refreshGroupTransactions: (groupId: string) => Promise<void>;
    }) => {

        // Initialize users array from the 'payer' list
        const users = response.payer.map((p) => ({
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
                const amountOwed = u.split - u.pay;
                if (amountOwed !== 0) {
                    return { id: u.id, amountOwed };
                } else {
                    addDoc(collection(db, "Transactions"), {
                        amount: 0,
                        created_at: response.created_at,
                        payer_id: u.id,
                        receiver_id: u.id,
                        type: 'expense',
                        expense_id: response.id,  // Optional: If you want to store the response id
                        group_id: response.group_id || '', // Optional: If you want to store the group id
                    });
                }
                return null; // Return null when no amount is owed
            })
            .filter((item) => item !== null);  // Remove null values

        console.log(usersNet);

        const transaction = [];

        // Step 4: Process each pair of users to determine who owes whom
        for (let i = 0; i < usersNet.length; i++) {
            for (let j = i + 1; j < usersNet.length; j++) {  // j starts from i + 1
                console.log(`Processing: ${usersNet[i].id} and ${usersNet[j].id}`);

                const total = usersNet[i].amountOwed + usersNet[j].amountOwed;

                if (usersNet[i].amountOwed < 0 && usersNet[j].amountOwed > 0) {
                    if (total > 0) {
                        transaction.push({
                            amount: -usersNet[i].amountOwed,
                            payer_id: usersNet[i].id,
                            receiver_id: usersNet[j].id,
                            created_at: response.created_at,  // Firestore's timestamp
                            type: 'expense', // Add a type if needed
                        });
                        usersNet[j].amountOwed = total;
                        usersNet[i].amountOwed = 0;
                    } else if (total < 0) {
                        transaction.push({
                            amount: usersNet[j].amountOwed,
                            payer_id: usersNet[i].id,
                            receiver_id: usersNet[j].id,
                            created_at: response.created_at,
                            type: 'expense',
                        });
                        usersNet[i].amountOwed = total;
                        usersNet[j].amountOwed = 0;
                    } else {
                        transaction.push({
                            amount: usersNet[j].amountOwed,
                            payer_id: usersNet[i].id,
                            receiver_id: usersNet[j].id,
                            created_at: response.created_at,
                            type: 'expense',
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
                            created_at: response.created_at,
                            type: 'expense',
                        });
                        usersNet[i].amountOwed = total;
                        usersNet[j].amountOwed = 0;
                    } else if (total < 0) {
                        transaction.push({
                            amount: usersNet[i].amountOwed,
                            payer_id: usersNet[j].id,
                            receiver_id: usersNet[i].id,
                            created_at: response.created_at,
                            type: 'expense',
                        });
                        usersNet[j].amountOwed = total;
                        usersNet[i].amountOwed = 0;
                    } else {
                        transaction.push({
                            amount: usersNet[i].amountOwed,
                            payer_id: usersNet[j].id,
                            receiver_id: usersNet[i].id,
                            created_at: response.created_at,
                            type: 'expense',
                        });
                        usersNet[i].amountOwed = 0;
                        usersNet[j].amountOwed = 0;
                    }
                }
            }
        }

        // Store the transactions in Firestore
        try {
            console.log('adding transaction')
            for (const trans of transaction) {
                // Store each transaction in the 'Transactions' collection
                await addDoc(collection(db, "Transactions"), {
                    ...trans,
                    expense_id: response.id,  // Optional: If you want to store the response id
                    group_id: response.group_id || '', // Optional: If you want to store the group id
                });
                if (response.group_id) {
                    await updateGroupBalance(trans.payer_id, trans.receiver_id, response.group_id, trans.amount);
                } else {
                    await updateUserBalance(trans.payer_id, trans.receiver_id, trans.amount);
                }

                await checkFriend(trans.payer_id, trans.receiver_id);
                if (response.group_id) {
                    await refreshFunctions.refreshGroupTransactions(response.group_id);
                }
                await refreshFunctions.refreshAllTransactions(
                    [trans.payer_id, trans.receiver_id],
                    response.group_id ? [response.group_id] : undefined
                );
            }
            console.log("Transactions stored successfully!");
        } catch (error) {
            console.error("Error storing transactions in Firestore:", error);
        }

        console.log(transaction, users);  // Final transaction log
        return transaction;
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
        if (transaction)
            if (transaction.group_id) {
                await updateGroupBalance(transaction.payer_id, transaction.receiver_id, transaction.group_id, -transaction.amount);
            } else {
                await updateUserBalance(transaction.payer_id, transaction.receiver_id, -transaction.amount);
            }

        try {
            // Update the document in Firestore
            await updateDoc(transactionRef, {
                amount: updatedTransaction.amount,
                created_at: updatedTransaction.created_at,
                expense_id: updatedTransaction.expense_id,
                group_id: updatedTransaction.group_id || "",
                payer_id: updatedTransaction.payer_id,
                receiver_id: updatedTransaction.receiver_id,
                type: updatedTransaction.type,
            });

            // Update local state
            setTransaction(updatedTransaction);

            // If the payer or amount changed, update user balances
            // This might require additional logic to handle the previous transaction's impact
            if (updatedTransaction.group_id) {
                await updateGroupBalance(updatedTransaction.payer_id, updatedTransaction.receiver_id, updatedTransaction.group_id, updatedTransaction.amount);
            } else {
                await updateUserBalance(updatedTransaction.payer_id, updatedTransaction.receiver_id, updatedTransaction.amount);
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
            // Optionally, handle the error (show toast, set error state, etc.)
        } finally {
            setTransaction(null);
        }
    };

    const deleteTransactionsByExpense = async (expenseId: string) => {
        try {
            // Create a query to find all transactions with type 'expense' and the given expense_id
            const transactionsRef = collection(db, "Transactions");
            const q = query(
                transactionsRef,
                where("type", "==", "expense"),
                where("expense_id", "==", expenseId)
            );

            // Get the snapshot of the matching documents
            const querySnapshot = await getDocs(q);
            console.log(querySnapshot.docs);
            // Iterate over the querySnapshot and delete each document
            for (const docSnapshot of querySnapshot.docs) {
                const docRef = doc(db, "Transactions", docSnapshot.id);  // Get the document reference by ID

                const transactionData = docSnapshot.data();
                const payerId = transactionData.payer_id;
                const receiverId = transactionData.receiver_id;
                const amount = transactionData.amount;

                // Update balances for both payer and receiver in the users collection
                if (transactionData.group_id) {
                    await updateGroupBalance(payerId, receiverId, transactionData.group_id, -amount);
                } else {
                    await updateUserBalance(payerId, receiverId, -amount);
                }
                await deleteDoc(docRef);  // Delete the document
                // if()
                console.log(`Transaction with ID ${docSnapshot.id} deleted.`);
            }

            console.log("All transactions with the specified expense_id have been deleted.");
        } catch (error) {
            console.error("Error deleting transactions:", error);
        }
    };

    // Return the provider with the context value
    return (
        <TransactionContext.Provider
            value={{
                transaction,
                deleteTransactionsByExpense,
                calculateTransaction,
                setTransaction,
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
