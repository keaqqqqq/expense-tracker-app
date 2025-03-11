'use client'
import { useBalance } from '@/context/HomeBalanceContext';
import React, { useState } from 'react';
import ManageHeader from '../ManageHeader';
import ExpenseModal from '../ManageExpense/ExpenseModal';
import TransactionModal from '../Transaction/TransactionModal';
import { refreshBalances } from '@/lib/actions/balance';
const HomeHeader = () => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { updateBalances } = useBalance();

  const openExpenseModal = () => setIsExpenseModalOpen(true);
  const openTransactionModal = () => setIsTransactionModalOpen(true);

  const closeExpenseModal = async () => {
    setIsExpenseModalOpen(false);
    await refreshBalancesData();
  };

  const closeTransactionModal = async () => {
    setIsTransactionModalOpen(false);
    await refreshBalancesData();
  };

  const refreshBalancesData = async () => {
    try {
      const newBalances = await refreshBalances();
      updateBalances(newBalances);
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    }
  };

  const headerButtons = [
    {
      label: "New expense",
      primary: true,
      onClick: openExpenseModal,
    },
    {
      label: "Settle up",
      secondary: true,
      onClick: openTransactionModal,
    }
  ];

  return (
    <>
      <ManageHeader 
        title="Balances" 
        buttons={headerButtons}
        homeType={true}
      />
      
      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        closeModal={closeExpenseModal}
        refreshAll={true}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        closeModal={closeTransactionModal}
      />
    </>
  );
}

export default HomeHeader;