'use client'
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FriendBalance } from "@/types/Balance";

interface HomeBalanceContextType {
  friendBalances: FriendBalance[];
  setFriendBalances: (balances: FriendBalance[]) => void;
  updateBalances: (newBalances: FriendBalance[]) => void;
}

const BalanceContext = createContext<HomeBalanceContextType | undefined>(undefined);

export function BalanceProvider({ 
  children,
  initialBalances 
}: { 
  children: React.ReactNode;
  initialBalances: FriendBalance[];
}) {
  const [friendBalances, setFriendBalances] = useState<FriendBalance[]>(initialBalances);

  const updateBalances = useCallback((newBalances: FriendBalance[]) => {
    setFriendBalances(newBalances);
  }, []);

  return (
    <BalanceContext.Provider value={{ friendBalances, setFriendBalances, updateBalances }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}