'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ExpenseContextType, ExpenseProviderProps, GroupedTransactions } from '@/types/ExpenseList';
import { fetchTransactions, fetchGroupTransactions } from '@/lib/actions/user.action';
import { useAuth } from './AuthContext';
import type { UserData } from '@/types/User';

interface ExtendedExpenseContextType extends ExpenseContextType {
  refreshTransactions: (friendId: string) => Promise<void>;
  refreshGroupTransactions: (groupId: string) => Promise<void>;
  usersData: Record<string, UserData>;
  isGroupLoading: boolean;
  groupTransactions: GroupedTransactions[];
}

const defaultContextValue: ExtendedExpenseContextType = {
  groupedTransactions: [],
  groupTransactions: [],
  isLoading: false,
  isGroupLoading: false,
  refreshTransactions: async () => {},
  refreshGroupTransactions: async () => {},
  usersData: {}
};

const ExpenseContext = createContext<ExtendedExpenseContextType>(defaultContextValue);

export const ExpenseProvider: React.FC<ExpenseProviderProps & { 
  usersData: Record<string, UserData>;
  initialGroupTransactions?: GroupedTransactions[];
}> = ({ 
  children,
  initialTransactions,
  initialGroupTransactions = [],
  usersData
}) => {
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions[]>(initialTransactions);
  const [groupTransactions, setGroupTransactions] = useState<GroupedTransactions[]>(initialGroupTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const [isGroupLoading, setIsGroupLoading] = useState(false);
  const { currentUser } = useAuth();

  const refreshTransactions = async (friendId: string) => {
    setIsLoading(true);
    try {
      if (!currentUser) {
        return;
      }
      const freshTransactions = await fetchTransactions(currentUser.uid, friendId);
      setGroupedTransactions(freshTransactions);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshGroupTransactions = async (groupId: string) => {
    setIsGroupLoading(true);
    try {
      if (!currentUser) {
        return;
      }
      const freshGroupTransactions = await fetchGroupTransactions(groupId);
      setGroupTransactions(freshGroupTransactions);
    } catch (error) {
      console.error('Error refreshing group transactions:', error);
    } finally {
      setIsGroupLoading(false);
    }
  };

  return (
    <ExpenseContext.Provider value={{ 
      groupedTransactions, 
      groupTransactions,
      isLoading,
      isGroupLoading,
      refreshTransactions,
      refreshGroupTransactions,
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