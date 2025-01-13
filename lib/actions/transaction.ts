'use server'
import { db } from '@/firebase/config';
import { Expense } from '@/types/Expense';
import { GroupedTransactions } from '@/types/ExpenseList';
import { Transaction } from '@/types/Transaction';
// import { Tr } from '@/types/Expense';

import { collection, addDoc, getDocs, doc, updateDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { fetchExpenseData } from './expenses';
// Define the collection reference
const transactionsCollection = collection(db, 'Transactions');

export const fetchTransactions = async (userId: string, friendId: string):Promise<Transaction[]> => {
    try {
      // Query where payer_id and receiver_id match either combination
      const q = query(
        transactionsCollection,
        where("payer_id", "in", [userId, friendId]),
        where("receiver_id", "in", [userId, friendId])
      );
  
      const querySnapshot = await getDocs(q);
  
      const transactions = querySnapshot.docs.map((doc) => ({
          ...doc.data() as Transaction,
          id: doc.id,
      }));
      return transactions;
    } catch (error) {
      console.error("Error fetching transactions: ", error);
      throw error;
    }
  };
  
export const createTransactionApi = async (newTransaction: Omit<Transaction, 'id'>) => {
    // Perform the logic to create a transaction (e.g., add to Firebase, update state)
    console.log('Creating new transaction:', newTransaction);

    await addDoc(transactionsCollection, { ...newTransaction, group_id: newTransaction.group_id || "" });
    // await updateUserBalance(newTransaction.payer_id, newTransaction.receiver_id, newTransaction.amount);
    if (newTransaction.group_id && newTransaction.group_id!=="") {
        await updateGroupBalance(newTransaction.payer_id, newTransaction.receiver_id, newTransaction.group_id, newTransaction.amount);
    } else {
        await updateUserBalance(newTransaction.payer_id, newTransaction.receiver_id, newTransaction.amount);
    }
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
            const payerBalances: { id: string, balance: number }[] = payerData?.balances || []; // Ensure payerBalances is typed as Balance[]
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

