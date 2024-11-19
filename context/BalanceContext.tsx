'use client'
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  fetchUserBalances, 
  fetchGroupBalances, 
  settleBalance 
} from '@/lib/actions/user.action';
import { db} from '../firebase/config';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import Toast from '@/components/Toast';

interface Balance {
  balance: number;
  id: string;
}

interface GroupBalance {
  groupId: string;
  name: string;
  image?: string;
  balance: number;
}

interface BalancesContextState {
  balances: Balance[];
  groupBalances: GroupBalance[];
  isLoading: boolean;
  toast: {
    message: string;
    type: 'success' | 'error';
  } | null;
}

interface BalancesContextValue extends BalancesContextState {
  updateBalances: (newBalances: Balance[]) => void;
  refreshBalances: (userId: string) => Promise<void>;
  handleSettleBalance: (currentUserId: string, targetId: string, type: 'friend' | 'group') => Promise<void>;
  setToast: (message: string, type: 'success' | 'error') => void;
}

interface BalancesProviderProps {
  children: React.ReactNode;
  userId: string;
  initialBalances: Balance[];
  initialGroupBalances: GroupBalance[];
}

const BalancesContext = createContext<BalancesContextValue | undefined>(undefined);

export function BalancesProvider({ 
  children, 
  userId,
  initialBalances = [],
  initialGroupBalances = []
}: BalancesProviderProps) {
  const [state, setState] = useState<BalancesContextState>({
    balances: initialBalances,
    groupBalances: initialGroupBalances,
    isLoading: false,
    toast: null
  });

  // Set up real-time listeners
  useEffect(() => {
    if (!userId) return;

    // Listen for current user's document changes
    const userRef = doc(db, 'Users', userId);
    const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
      if (userDoc.exists()) {
        try {
          // Get all balances when the user's document changes
          const newBalances = await fetchUserBalances(userId);
          setState(prev => ({
            ...prev,
            balances: newBalances
          }));
        } catch (error) {
          console.error('Error updating balances:', error);
        }
      }
    });

    // Listen for group changes where user is a member
    const groupsRef = collection(db, 'Groups');
    const groupQuery = query(groupsRef, where('members', 'array-contains', { id: userId }));
    const unsubscribeGroups = onSnapshot(groupQuery, async () => {
      try {
        const newGroupBalances = await fetchGroupBalances(userId);
        setState(prev => ({
          ...prev,
          groupBalances: newGroupBalances
        }));
      } catch (error) {
        console.error('Error updating group balances:', error);
      }
    });

    // Listen for changes in other users' documents that might affect balances
    const usersRef = collection(db, 'Users');
    const unsubscribeOtherUsers = onSnapshot(usersRef, async () => {
      try {
        const newBalances = await fetchUserBalances(userId);
        setState(prev => ({
          ...prev,
          balances: newBalances
        }));
      } catch (error) {
        console.error('Error updating balances from other users:', error);
      }
    });

    // Cleanup listeners
    return () => {
      unsubscribeUser();
      unsubscribeGroups();
      unsubscribeOtherUsers();
    };
  }, [userId]);

  const setToast = useCallback((message: string, type: 'success' | 'error') => {
    setState(prev => ({
      ...prev,
      toast: { message, type }
    }));
  }, []);

  const clearToast = useCallback(() => {
    setState(prev => ({
      ...prev,
      toast: null
    }));
  }, []);

  const updateBalances = useCallback((newBalances: Balance[]) => {
    setState(prev => ({
      ...prev,
      balances: newBalances
    }));
  }, []);

  const refreshBalances = useCallback(async (userId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const [newBalances, newGroupBalances] = await Promise.all([
        fetchUserBalances(userId),
        fetchGroupBalances(userId)
      ]);
      
      setState(prev => ({
        ...prev,
        balances: newBalances,
        groupBalances: newGroupBalances,
        isLoading: false
      }));
    } catch (error) {
      setToast('Failed to refresh balances', 'error');
      console.error('Error refreshing balances:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [setToast]);

  const handleSettleBalance = useCallback(async (currentUserId: string, targetId: string, type: 'friend' | 'group') => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await settleBalance(currentUserId, targetId, type);
      await refreshBalances(currentUserId);
      setToast('Balance settled successfully', 'success');
    } catch (error) {
      setToast('Failed to settle balance', 'error');
      console.error('Error settling balance:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [refreshBalances, setToast]);

  return (
    <BalancesContext.Provider 
      value={{ 
        ...state,
        updateBalances,
        refreshBalances,
        handleSettleBalance,
        setToast
      }}
    >
      {children}
      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type}
          onClose={clearToast}
        />
      )}
    </BalancesContext.Provider>
  );
}

export const useBalances = () => {
  const context = useContext(BalancesContext);
  if (!context) {
    throw new Error('useBalances must be used within a BalancesProvider');
  }
  return context;
};