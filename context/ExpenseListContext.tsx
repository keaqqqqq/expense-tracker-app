'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ExpenseContextType, ExpenseProviderProps, GroupedTransactions } from '@/types/ExpenseList';
import { fetchTransactions } from '@/lib/actions/user.action';
import { useAuth } from './AuthContext';
import type { UserData } from '@/types/User';

interface ExtendedExpenseContextType extends ExpenseContextType {
  refreshTransactions: (friendId: string) => Promise<void>;
  usersData: Record<string, UserData>;
}

const defaultContextValue: ExtendedExpenseContextType = {
  groupedTransactions: [],
  isLoading: false,
  refreshTransactions: async () => {},
  usersData: {}
};

const ExpenseContext = createContext<ExtendedExpenseContextType>(defaultContextValue);

export const ExpenseProvider: React.FC<ExpenseProviderProps & { usersData: Record<string, UserData> }> = ({ 
  children,
  initialTransactions,
  usersData
}) => {
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransactions[]>(initialTransactions);
  const [isLoading, setIsLoading] = useState(false);
  const {currentUser} = useAuth();

  const refreshTransactions = async (friendId: string) => {
    setIsLoading(true);
    try {
      if(!currentUser){
        return;
      }
      const freshTransactions = await fetchTransactions(currentUser?.uid, friendId);
      setGroupedTransactions(freshTransactions);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ExpenseContext.Provider value={{ 
      groupedTransactions, 
      isLoading, 
      refreshTransactions,
      usersData
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = (): ExtendedExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};