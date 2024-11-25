'use client'
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  fetchUserBalances, 
  fetchGroupBalances, 
  fetchFriendGroupBalances,
  settleBalance 
} from '@/lib/actions/user.action';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import Toast from '@/components/Toast';

// Basic balance interface for 1:1 balances
interface Balance {
  balance: number;
  id: string;
}

// Interface for group member balances
interface GroupBalance {
  groupId: string;
  userId: string;
  userName: string;
  userEmail: string;
  memberBalance: number;
  memberId: string;  
  memberName: string; 
  memberImage: string;
  memberEmail: string;
}

// Interface for friend's group balances
interface FriendGroupBalance {
  groupId: string;
  groupName: string;
  groupImage: string;
  balance: number;
  memberId: string;
  memberName: string;
}

// Context state interface
interface BalancesContextState {
  balances: Balance[];
  groupBalances: GroupBalance[];
  friendGroupBalances: FriendGroupBalance[];
  isLoading: boolean;
  toast: {
    message: string;
    type: 'success' | 'error';
  } | null;
}

interface BalancesContextValue extends BalancesContextState {
  updateBalances: (newBalances: Balance[]) => void;
  refreshBalances: (userId: string, friendId?: string) => Promise<void>;
  handleSettleBalance: (currentUserId: string, targetId: string, type: 'friend' | 'group') => Promise<void>;
  setToast: (message: string, type: 'success' | 'error') => void;
}

interface BalancesProviderProps {
  children: React.ReactNode;
  userId: string;
  initialBalances?: Balance[];
  initialGroupBalances?: GroupBalance[];
  initialFriendGroupBalances?: FriendGroupBalance[]; 
  groupId?: string;
}

const BalancesContext = createContext<BalancesContextValue | undefined>(undefined);

export function BalancesProvider({ 
  children, 
  userId,
  initialBalances = [],
  initialGroupBalances = [],
  initialFriendGroupBalances = [], 
  groupId
}: BalancesProviderProps) {
  const [state, setState] = useState<BalancesContextState>({
    balances: initialBalances,
    groupBalances: initialGroupBalances,
    friendGroupBalances: initialFriendGroupBalances,
    isLoading: false,
    toast: null
  });

  useEffect(() => {
    if (!userId) return;
  
    const unsubscribeHandlers: (() => void)[] = [];
  
    // Listen for changes in user's balances
    const userRef = doc(db, 'Users', userId);
    const unsubscribeUser = onSnapshot(userRef, async (userDoc) => {
      if (userDoc.exists()) {
        try {
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
    unsubscribeHandlers.push(unsubscribeUser);
  
    // Listen for changes in group balances if groupId is provided
    if (groupId) {
      const groupRef = doc(db, 'Groups', groupId);
      const unsubscribeGroup = onSnapshot(groupRef, async (groupDoc) => {
        if (groupDoc.exists()) {
          try {
            const newGroupBalances = await fetchGroupBalances(userId, groupId);
            setState(prev => ({
              ...prev,
              groupBalances: newGroupBalances
            }));
          } catch (error) {
            console.error('Error updating group balances:', error);
          }
        }
      });
      unsubscribeHandlers.push(unsubscribeGroup);
    }
  
    // Listen for changes in all users' balances
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
    unsubscribeHandlers.push(unsubscribeOtherUsers);
  
    return () => {
      unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, groupId]);

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

  const refreshBalances = useCallback(async (userId: string, friendId?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const [newBalances, newGroupBalances, newFriendGroupBalances] = await Promise.all([
        fetchUserBalances(userId),
        groupId ? fetchGroupBalances(userId, groupId) : Promise.resolve([]),
        friendId ? fetchFriendGroupBalances(userId, friendId) : Promise.resolve([])
      ]);
      
      setState(prev => ({
        ...prev,
        balances: newBalances,
        groupBalances: newGroupBalances,
        friendGroupBalances: newFriendGroupBalances,
        isLoading: false
      }));
    } catch (error) {
      setToast('Failed to refresh balances', 'error');
      console.error('Error refreshing balances:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [groupId, setToast]);

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