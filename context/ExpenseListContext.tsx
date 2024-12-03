'use client'
import React, { createContext, useContext, useState } from 'react';
import type { ExpenseContextType, ExpenseProviderProps, GroupedTransactions } from '@/types/ExpenseList';
import { fetchTransactions, fetchGroupTransactions, fetchUserData } from '@/lib/actions/user.action';
import { useAuth } from './AuthContext';
import type { UserData } from '@/types/User';
import { fetchAllTransactions } from '@/lib/actions/user.action';
import { serializeFirebaseData } from '@/lib/utils';
import { Transaction } from '@/types/Transaction';
interface ExtendedExpenseContextType extends ExpenseContextType {
  refreshTransactions: (friendId: string) => Promise<void>;
  refreshGroupTransactions: (groupId: string) => Promise<void>; 
  refreshAllTransactions: (friendIds?: string[], groupIds?: string[]) => Promise<void>;
  usersData: Record<string, UserData>;
  groupDetails?: Record<string, string>; 
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
  refreshTransactions: () => Promise.resolve(),
  refreshGroupTransactions: () => Promise.resolve(),
  refreshAllTransactions: () => Promise.resolve(),
  usersData: {}
};

const ExpenseContext = createContext<ExtendedExpenseContextType>(defaultContextValue);

export const ExpenseProvider: React.FC<ExpenseProviderProps & { 
  usersData: Record<string, UserData>;
  groupDetails?: Record<string, string>;
  initialGroupTransactions?: GroupedTransactions[];
  initialAllTransactions?: GroupedTransactions[];

}> = ({ 
  children,
  initialTransactions,
  initialGroupTransactions = [],
  initialAllTransactions = [],
  usersData: initialUsersData, 
  groupDetails
}) => {
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions[]>(initialTransactions);
  const [groupTransactions, setGroupTransactions] = useState<GroupedTransactions[]>(initialGroupTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const [allTransactions, setAllTransactions] = useState<GroupedTransactions[]>(initialAllTransactions);
  const [usersData, setUsersData] = useState<Record<string, UserData>>(initialUsersData);
  const [isAllTransactionsLoading, setIsAllTransactionsLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchNewUserData = async (transactions: GroupedTransactions[]) => {
    const newUserIds = new Set<string>();
    
    transactions.forEach((group) => {
      group.transactions.forEach((transaction: Transaction) => {
        if (!usersData[transaction.payer_id]) newUserIds.add(transaction.payer_id);
        if (!usersData[transaction.receiver_id]) newUserIds.add(transaction.receiver_id);
      });
      
      if (group.expense) {
        group.expense.payer?.forEach(payer => {
          if (!usersData[payer.id]) newUserIds.add(payer.id);
        });
        group.expense.splitter?.forEach(splitter => {
          if (!usersData[splitter.id]) newUserIds.add(splitter.id);
        });
      }
    });

    if (newUserIds.size === 0) return;

    const newUsersDataArray = await Promise.all(
      Array.from(newUserIds).map(async (userId) => {
        try {
          const userData = await fetchUserData(userId);
          return [userId, serializeFirebaseData(userData)];
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return [userId, { id: userId, name: userId }];
        }
      })
    );

    setUsersData(prev => ({
      ...prev,
      ...Object.fromEntries(newUsersDataArray)
    }));
  };


  const refreshTransactions = async (friendId: string) => {
    setIsLoading(true);
    try {
      if (!currentUser) return;
  
      const freshTransactions = await fetchTransactions(currentUser.uid, friendId);
      await fetchNewUserData(freshTransactions);

      setGroupedTransactions(prevTransactions => {
        const existingTransactions = prevTransactions.filter(transaction => 
          !transaction.transactions.some(t => 
            t.payer_id === friendId || t.receiver_id === friendId
          )
        );
  
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
      await fetchNewUserData(freshGroupTransactions);

      setGroupTransactions(prevTransactions => {
        const filteredTransactions = prevTransactions.filter(group => 
          !group.transactions.some(t => t.group_id === groupId)
        );
        
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
      await fetchNewUserData(freshAllTransactions);
      setAllTransactions(freshAllTransactions);

      if (groupIds?.length) {
        const relevantGroupTransactions = freshAllTransactions.filter(group =>
          group.transactions.some(t => 
            groupIds.includes(t.group_id || '')
          )
        );
        
        setGroupTransactions(relevantGroupTransactions);

        const nonGroupTransactions = freshAllTransactions.filter(group =>
          !group.transactions.some(t => 
            groupIds.includes(t.group_id || '')
          )
        );
        setGroupedTransactions(nonGroupTransactions);
      } else {
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
      usersData,
      ...(groupDetails && { groupDetails })
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