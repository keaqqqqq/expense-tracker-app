'use client'
import React, { createContext, useContext, useState } from 'react';
import type { ExpenseContextType, ExpenseProviderProps, GroupedTransactions } from '@/types/ExpenseList';
import { fetchTransactions, fetchGroupTransactions } from '@/lib/actions/user.action';
import { useAuth } from './AuthContext';
import type { UserData } from '@/types/User';
import { fetchAllTransactions } from '@/lib/actions/user.action';
interface ExtendedExpenseContextType extends ExpenseContextType {
  refreshTransactions: (friendId: string) => Promise<void>;
  refreshGroupTransactions: (groupId: string) => Promise<void>; 
  refreshAllTransactions: (friendIds?: string[], groupIds?: string[]) => Promise<void>;
  usersData: Record<string, UserData>;
  isGroupLoading: boolean;
  groupTransactions: GroupedTransactions[];
  allTransactions: GroupedTransactions[];
  isAllTransactionsLoading: boolean;
}

const defaultContextValue: ExtendedExpenseContextType = {
  groupedTransactions: [],
  groupTransactions: [],
  allTransactions: [],
  isLoading: false,
  isGroupLoading: false,
  isAllTransactionsLoading: false,
  refreshTransactions: async () => {},
  refreshGroupTransactions: async () => {},
  refreshAllTransactions: async () => {},
  usersData: {}
};

const ExpenseContext = createContext<ExtendedExpenseContextType>(defaultContextValue);

export const ExpenseProvider: React.FC<ExpenseProviderProps & { 
  usersData: Record<string, UserData>;
  initialGroupTransactions?: GroupedTransactions[];
  initialAllTransactions?: GroupedTransactions[];

}> = ({ 
  children,
  initialTransactions,
  initialGroupTransactions = [],
  initialAllTransactions = [],
  usersData
}) => {
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions[]>(initialTransactions);
  const [groupTransactions, setGroupTransactions] = useState<GroupedTransactions[]>(initialGroupTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [allTransactions, setAllTransactions] = useState<GroupedTransactions[]>(initialAllTransactions);
  const [isAllTransactionsLoading, setIsAllTransactionsLoading] = useState(false);
  const { currentUser } = useAuth();

  const refreshTransactions = async (friendId: string) => {
    setIsLoading(true);
    try {
      if (!currentUser) return;
  
      // Fetch transactions for the friend
      const freshTransactions = await fetchTransactions(currentUser.uid, friendId);
  
      // Update state with new transactions
      setGroupedTransactions(prevTransactions => {
        // Remove all transactions involving the refreshed friend
        const existingTransactions = prevTransactions.filter(transaction => 
          !transaction.transactions.some(t => 
            t.payer_id === friendId || t.receiver_id === friendId
          )
        );
  
        // Add new transactions
        return [...existingTransactions, ...freshTransactions];
      });
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshGroupTransactions = async (groupId: string) => {
    setIsGroupLoading(true);
    try {
      if (!currentUser) return;
  
      const freshGroupTransactions = await fetchGroupTransactions(groupId);
      
      setGroupTransactions(prevTransactions => {
        // Remove the old group transactions
        const filteredTransactions = prevTransactions.filter(group => 
          !group.transactions.some(t => t.group_id === groupId)
        );
        
        // Add the fresh transactions
        return [...filteredTransactions, ...freshGroupTransactions];
      });
    } catch (error) {
      console.error('Error refreshing group transactions:', error);
    } finally {
      setIsGroupLoading(false);
    }
  };

  const refreshAllTransactions = async (friendIds?: string[], groupIds?: string[]) => {
    setIsAllTransactionsLoading(true);
    try {
      if (!currentUser) return;

      const freshAllTransactions = await fetchAllTransactions(
        currentUser.uid,
        friendIds,
        groupIds
      );

      // Update all transactions state
      setAllTransactions(freshAllTransactions);

      // Handle group transactions first if groupIds are provided
      if (groupIds?.length) {
        // Filter out relevant group transactions
        const relevantGroupTransactions = freshAllTransactions.filter(group =>
          group.transactions.some(t => 
            groupIds.includes(t.group_id || '')
          )
        );
        
        // Set group transactions directly without merging with previous state
        setGroupTransactions(relevantGroupTransactions);

        // For groupedTransactions, exclude the ones we just put in groupTransactions
        const nonGroupTransactions = freshAllTransactions.filter(group =>
          !group.transactions.some(t => 
            groupIds.includes(t.group_id || '')
          )
        );
        setGroupedTransactions(nonGroupTransactions);
      } else {
        // If no groupIds, just update groupedTransactions normally
        setGroupedTransactions(freshAllTransactions);
      }

    } catch (error) {
      console.error('Error refreshing all transactions:', error);
    } finally {
      setIsAllTransactionsLoading(false);
    }
};

  return (
    <ExpenseContext.Provider value={{ 
      groupedTransactions, 
      groupTransactions,
      allTransactions,
      isLoading,
      isGroupLoading,
      isAllTransactionsLoading,
      refreshTransactions,
      refreshGroupTransactions,
      refreshAllTransactions,
      usersData
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenseList = (): ExtendedExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};