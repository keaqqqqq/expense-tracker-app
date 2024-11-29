'use client'
import { useBalance } from '@/context/HomeBalanceContext';
import React, { useState } from 'react';
import ManageHeader from '../ManageHeader';
import ExpenseModal from '../ManageExpense/ExpenseModal';
import { refreshBalances } from '@/lib/actions/user.action';
const HomeHeader = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { updateBalances } = useBalance();

  const openModal = () => setIsModalOpen(true);
  const closeModal = async () => {
    setIsModalOpen(false);
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
      onClick: openModal,
    },
    {
      label: "Settle up",
      secondary: true,
      onClick: () => {}, 
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
        isOpen={isModalOpen} 
        closeModal={closeModal}
        refreshAll={true}
      />
    </>
  );
}

export default HomeHeader;