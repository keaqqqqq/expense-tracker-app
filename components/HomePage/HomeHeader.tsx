'use client'
import React, { useState } from 'react';
import ManageHeader from '../ManageHeader';
import ExpenseModal from '../ManageExpense/ExpenseModal';
const HomeHeader = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

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
        refreshAll={false}
      />
    </>
  );
};

export default HomeHeader;