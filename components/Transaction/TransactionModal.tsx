import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from '../ManageExpense/Button';
import FormInput from '../FormInput';
import { useExpense } from '@/context/ExpenseContext';
import { SplitFriend } from '@/types/SplitFriend';
import { ArrowRightLeft, MoveRight } from 'lucide-react';
import SearchableSelect from '../SearchableSelect';
import { useTransaction } from '@/context/TransactionContext';
import Image from 'next/image';
import { useExpenseList } from '@/context/ExpenseListContext';
interface TransactionModalProps {
  isOpen: boolean;
  closeModal: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, closeModal }) => {
  const { createTransaction, transaction, editTransaction } = useTransaction();
  const { friendList, expenses, groupList } = useExpense();
  const [payer, setPayer] = useState<Omit<SplitFriend, 'amount'> | undefined>();
  const [receiver, setReceiver] = useState<Omit<SplitFriend, 'amount'> | undefined>();
  const [amount, setAmount] = useState<number | undefined>();
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expenseGroup, setExpenseGroup] = useState<string | null>(null);
  const { 
    refreshTransactions, 
    refreshGroupTransactions, 
    refreshAllTransactions 
} = useExpenseList();
  const handleExchangeUsers = () => {
    const tempReceiver = receiver;
    setReceiver(payer);
    setPayer(tempReceiver);
  };

  const handleRefresh = async () => {
    if (selectedExpense) {
      const expense = expenses.find(e => e.id === selectedExpense);
      if (expense) {
        const participantIds = Array.from(new Set(
          expense.splitter.map(s => s.id)
            .concat(expense.payer.map(p => p.id))
        )).filter(id => id !== expense.created_by);

        if (expenseGroup || selectedGroup) {
          const groupId = expenseGroup || selectedGroup;
          await refreshGroupTransactions(groupId!);
        }

        if (participantIds.length === 1) {
          await refreshTransactions(participantIds[0]);
        } else if (participantIds.length > 1) {
          await refreshAllTransactions(participantIds);
        }
      }
    } else {
      // For direct payments
      const participants = [payer?.id, receiver?.id].filter((id): id is string => id !== undefined);
      
      if (selectedGroup) {
        await refreshGroupTransactions(selectedGroup);
      }

      if (participants.length === 1) {
        await refreshTransactions(participants[0]);
      } else if (participants.length > 1) {
        await refreshAllTransactions(participants);
      }
    }
  };


  const handleCreateTransaction = async () => {
    const group_id = (expenseGroup ? expenseGroup : (selectedGroup ? selectedGroup : null))
    const expense_id = (selectedExpense ? selectedExpense : 'direct-payment')
    const type = (selectedExpense ? 'settle' : '');
    if (amount && selectedDate && payer && receiver)
      await createTransaction({
        amount,
        type,
        created_at: selectedDate,// Timestamp or date string
        payer_id: payer.id,
        receiver_id: receiver.id,
        group_id, // Optional
        expense_id,
      });
      await handleRefresh();

    resetTransaction();
    closeModal();
  }
  const handleEditTransaction = async () => {
    const group_id = (expenseGroup ? expenseGroup : selectedGroup ? selectedGroup : null)
    const expense_id = (selectedExpense ? selectedExpense : 'direct-payment')
    const type = (selectedExpense ? 'settle' : '');
    if (amount && selectedDate && payer && receiver && transaction?.id)
      await editTransaction({
        id: transaction.id,
        amount,
        type,
        created_at: selectedDate,// Timestamp or date string
        payer_id: payer.id,
        receiver_id: receiver.id,
        group_id, // Optional
        expense_id,
      });
      await handleRefresh();

    resetTransaction();
    closeModal();
  }

  useEffect(() => {
    console.log(transaction);
    if (transaction) {
      const payerFriend = friendList.find(friend => friend.id === transaction.payer_id);
      const receiverFriend = friendList.find(friend => friend.id === transaction.receiver_id);
      setPayer(payerFriend);
      setReceiver(receiverFriend);
      setAmount(transaction.amount);
      setSelectedExpense((transaction.expense_id === 'direct-payment' ? null : transaction.expense_id));
      setSelectedGroup(transaction.group_id);
      setSelectedDate(transaction.created_at);
    }
  }, [transaction]);

  useEffect(() => {
    const groupId = expenses.find(expense => expense.id === selectedExpense)?.group_id;
    if (groupId) {
      setExpenseGroup(groupId)
    } else {
      setExpenseGroup(null)
    }
  }, [selectedExpense])

  const resetTransaction = () => {
    // setTransaction(null);
    setPayer(undefined);
    setReceiver(undefined);
    setAmount(undefined);
    setSelectedDate(null);
    setSelectedExpense(null);
    setSelectedGroup(null);
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setAmount(undefined);
    } else {
      setAmount(Number(Number(value).toFixed(2)));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Transform data for SearchableSelect
  // For payer options - exclude the receiver
  const payerOptions = useMemo(() => {
    // Start with the full friendList
    let filteredFriends = [...friendList];

    // Remove receiver from options if it exists
    if (receiver) {
      filteredFriends = filteredFriends.filter(friend => friend.id !== receiver.id);
    }

    // If a group is selected, filter by group members
    if (selectedGroup) {
      const group = groupList.find(g => g.id === selectedGroup);
      if (group && (!selectedExpense)) {
        const activeGroupMemberIds = group.members
          .filter(member => member.status === 'ACTIVE')
          .map(member => member.id);

        filteredFriends = filteredFriends.filter(
          friend => activeGroupMemberIds.includes(friend.id)
        );
      }
    }

    // If an expense is selected, filter by expense participants
    if (selectedExpense) {
      const expense = expenses.find(e => e.id === selectedExpense);
      if (expense) {
        const expenseParticipantIds = new Set([
          ...expense.payer.map(p => p.id),
          ...expense.splitter.map(s => s.id)
        ]);

        filteredFriends = filteredFriends.filter(
          friend => expenseParticipantIds.has(friend.id)
        );

      }
    }

    // Map the filtered friends to the required format
    return filteredFriends.map(friend => ({
      value: friend.id,
      label: friend.name
    }));
  }, [friendList, receiver, selectedGroup, selectedExpense, groupList, expenses]);

  // For receiver options - we can keep the original friendOptions logic
  const receiverOptions = useMemo(() => {
    // Start with the full friendList
    let filteredFriends = [...friendList];

    // Remove payer from options if it exists
    if (payer) {
      filteredFriends = filteredFriends.filter(friend => friend.id !== payer.id);
    }

    // If a group is selected, filter by group members
    if (selectedGroup) {
      const group = groupList.find(g => g.id === selectedGroup);
      if (group && (!selectedExpense)) {
        const activeGroupMemberIds = group.members
          .filter(member => member.status === 'ACTIVE')
          .map(member => member.id);

        filteredFriends = filteredFriends.filter(
          friend => activeGroupMemberIds.includes(friend.id)
        );
      }
    }

    // If an expense is selected, filter by expense participants
    if (selectedExpense) {
      const expense = expenses.find(e => e.id === selectedExpense);
      if (expense) {
        const expenseParticipantIds = new Set([
          ...expense.payer.map(p => p.id),
          ...expense.splitter.map(s => s.id)
        ]);

        filteredFriends = filteredFriends.filter(
          friend => expenseParticipantIds.has(friend.id)
        );
      }
    }

    return filteredFriends.map(friend => ({
      value: friend.id,
      label: friend.name
    }));
  }, [friendList, payer, selectedGroup, selectedExpense, groupList, expenses]);

  const expenseOptions = useMemo(() => {
    // Start with all expenses
    let filteredExpenses = [...expenses];

    // If either payer or receiver is selected, filter expenses
    if (payer || receiver || selectedGroup) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const participantIds = new Set([
          ...expense.payer.map(p => p.id),
          ...expense.splitter.map(s => s.id)
        ]);

        // Check if both selected users are participants in the expense
        const payerMatch = !payer || participantIds.has(payer.id);
        const receiverMatch = !receiver || participantIds.has(receiver.id);

        const groupMatch = !selectedGroup || (expense.group_id === selectedGroup);
        return payerMatch && receiverMatch && groupMatch;
      });
    }



    return filteredExpenses.map(expense => ({
      value: expense.id,
      label: expense.description
    }));
  }, [expenses, payer, receiver, selectedGroup]);

  const groupOptions = useMemo(() => {
    // Start with all groups
    let filteredGroups = [...groupList];

    // If either payer or receiver is selected, filter groups
    if (payer || receiver) {
      filteredGroups = filteredGroups.filter(group => {
        // Get active member IDs from the group
        const activeMemberIds = group.members
          .filter(member => member.status === 'ACTIVE')
          .map(member => member.id);

        // Check if both selected users are active members of the group
        const payerMatch = !payer || activeMemberIds.includes(payer.id);
        const receiverMatch = !receiver || activeMemberIds.includes(receiver.id);

        return payerMatch && receiverMatch;
      });
    }
    if(selectedExpense){
      const expense = expenses.find(e=>e.id ===selectedExpense);
      if(expense)
      {
        filteredGroups = filteredGroups.filter(group =>{
          return group.id === expense.group_id || ''
        })
      }
    }

    return filteredGroups.map(group => ({
      value: group.id,
      label: group.name
    }));
  }, [groupList, payer, receiver, selectedExpense]);

  return (
    <Dialog open={isOpen} onClose={closeModal} className="relative z-[9999]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <DialogPanel className="rounded bg-white my-4 mx-2 sm:mx-0 w-full max-w-lg">
            <DialogTitle className="font-semibold text-sm border-b px-5 py-3">
              New Transaction
            </DialogTitle>

            <div className="px-5 py-2 flex flex-col font-semibold text-xs text-gray-700 border-b">
              {/* User Images Section */}
              <div className='flex flex-row justify-center'>
                <div className='w-20 h-20 rounded-full overflow-hidden border'>
                  {payer ? (
                    <Image
                      src={payer.image}
                      alt='Payer'
                      className='w-full h-full object-cover'
                      unoptimized
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className='bg-gray-200 w-full h-full' />
                  )}
                </div>

                <div className='flex flex-col mx-2 my-auto'>
                  <MoveRight className='mx-auto my-1.5' />
                  <ArrowRightLeft
                    className='mx-auto h-4 w-4 text-gray-300 hover:text-indigo-500 cursor-pointer'
                    onClick={handleExchangeUsers}
                  />
                </div>

                <div className='w-20 h-20 rounded-full overflow-hidden border'>
                  {receiver ? (
                    <Image
                      src={receiver.image}
                      alt='Receiver'
                      className='w-full h-full object-cover'
                      unoptimized
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className='bg-gray-200 w-full h-full' />
                  )}
                </div>
              </div>

              {/* User Selection Section */}
              <div className='flex flex-row'>
                <div className='flex flex-col w-full'>
                  <SearchableSelect
                    options={payerOptions}
                    value={payer?.id}
                    onChange={(value) => {
                      const friend = friendList.find(f => f.id === value);
                      if (friend) setPayer(friend);
                    }}
                    onClear={() => setPayer(undefined)}
                    placeholder="Type or select payer"
                    className="mt-2"
                  />
                </div>
                <div className='w-20 flex flex-row mx-2 my-auto'>paid</div>
                <div className='flex flex-col w-full'>
                  <SearchableSelect
                    options={receiverOptions}
                    value={receiver?.id}
                    onChange={(value) => {
                      const friend = friendList.find(f => f.id === value);
                      if (friend) setReceiver(friend);
                    }}
                    onClear={() => setReceiver(undefined)}
                    placeholder="Type or select receiver"
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Amount and Date Section */}
              <div className='flex flex-row mt-4'>
                <div className='flex flex-col w-full'>
                  <label htmlFor="amount">Amount</label>
                  <div className="relative w-full flex">
                    <FormInput
                      id="amount"
                      value={amount}
                      type="number"
                      className='flex-grow ml-0 text-right'
                      onChange={handleAmountChange}
                      min={0}
                      step={0.01}
                      required
                    />
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                      RM
                    </span>
                  </div>
                </div>
                <div className='flex flex-col w-full'>
                  <label htmlFor="date">Date</label>
                  <FormInput
                    id="date"
                    type='date'
                    className='ml-0'
                    value={selectedDate ? selectedDate : undefined}
                    onChange={handleDateChange}
                    required
                  />
                </div>
              </div>

              {/* Expense and Group Section */}
              <div className='flex flex-row'>
                <div className='flex flex-col w-full'>
                  <label>For Expense</label>
                  <SearchableSelect
                    options={expenseOptions}
                    value={(selectedExpense === null ? undefined : selectedExpense)}
                    onClear={() => setSelectedExpense(null)}
                    onChange={setSelectedExpense}
                    placeholder="Type or select expense"
                    className="mt-2 mr-2"
                  />
                </div>
                <div className='flex flex-col w-full'>
                  <label>Within Group</label>
                  <SearchableSelect
                    options={groupOptions}
                    value={(selectedExpense === null) ? (selectedGroup ? selectedGroup : undefined) : (expenseGroup ? expenseGroup : undefined)}
                    onChange={setSelectedGroup}
                    onClear={() => setSelectedGroup(null)}
                    placeholder="Type or select group"
                    className="mt-2 mr-2"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-100 rounded-b-lg text-xs font-semibold flex justify-end px-2 py-3">
              <Button
                className="border rounded bg-white mx-1"
                onClick={()=>{closeModal();resetTransaction()}}
              >
                Cancel
              </Button>
              <Button
                primary
                className="mx-1"
                onClick={(transaction?.id ? handleEditTransaction : handleCreateTransaction)}
              >
                {transaction?.id ? 'Edit' : 'Create'}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default TransactionModal;