'use client';

import { useState } from 'react';
import AddGroup from '@/components/Groups/AddGroup';
import { useRouter } from 'next/navigation';
import { ExpenseProvider } from '@/context/ExpenseListContext';
import { BalancesProvider } from '@/context/BalanceContext';
import ExpenseCard from '@/components/ExpenseCard';
import ExpenseList from '@/components/ExpenseList';
import ManageGroup from '@/components/Groups/ManageGroup';
import Balances from '@/components/Balances/Balance';
import { Suspense } from 'react';
import { Group } from '@/types/Group';
import { Friend } from '@/types/Friend';
import { UserData } from '@/types/User';
import { GroupedTransactions } from '@/types/ExpenseList';
import { GroupBalance } from '@/types/Balance';
interface GroupDetailsClientProps {
  group: Group; 
  uid: string;
  groupFriends: Friend[]; 
  usersData: Record<string, UserData>; 
  balance: number;
  initialTransactions: GroupedTransactions[];
  groupBalances: GroupBalance[];
  inviteLink: string;
}

export default function GroupDetailsClient({
  group,
  uid,
  groupFriends,
  usersData,
  balance,
  initialTransactions,
  groupBalances,
  inviteLink
}: GroupDetailsClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    router.refresh();
  };

  return (
    <div className="relative">
      <ExpenseProvider 
        initialTransactions={initialTransactions}
        usersData={usersData}
      >
        <BalancesProvider
          userId={uid}
          initialGroupBalances={groupBalances} 
          groupId={group.id}
        >
          {/* Mobile-only sequence */}
          <div className="block md:hidden space-y-6">
            {/* 1. Expense Card */}
            <ExpenseCard  
              name={group.name}
              amount={balance}
              type="group"
              memberCount={group.members.length}
              groupType={group.type}
              imageUrl={group.image}
              groupId={group.id}
            />
            
            {/* 2. Manage Group */}
            <ManageGroup 
              groupId={group.id}
              groupName={group.name}
              inviteLink={inviteLink}
              groupData={group}
              currentUserId={uid}
              groupFriends={groupFriends}  
              currentUserEmail={usersData[uid]?.email || ''}
              currentUserImage={usersData[uid]?.image}
              modalStateProps={{
                isEditModalOpen,
                setIsEditModalOpen,
                onEditSuccess: handleEditSuccess
              }}
            />
            
            {/* 3. Balances */}
            <Balances
              type="group"
              groupData={group}   
              currentUserId={uid}
              groupId={group.id}
            />
            
            {/* 4. Expense List */}
            <Suspense fallback={<div className="text-center">Loading expenses...</div>}>
              <ExpenseList currentUserId={uid}/>
            </Suspense>
          </div>

          {/* Desktop grid layout (hidden on mobile) */}
          <div className="hidden md:grid md:grid-cols-4 gap-5 xl:gap-0">
            <div className="md:col-span-3">
              <div className="flex flex-col gap-2">
                <ExpenseCard  
                  name={group.name}
                  amount={balance}
                  type="group"
                  memberCount={group.members.length}
                  groupType={group.type}
                  imageUrl={group.image}
                  groupId={group.id}
                />
                <Suspense fallback={<div className="text-center">Loading expenses...</div>}>
                  <ExpenseList currentUserId={uid}/>
                </Suspense>
              </div>
            </div>
            
            <div className="md:col-span-1 space-y-4">
              <div className="sticky top-4">
                <ManageGroup 
                  groupId={group.id}
                  groupName={group.name}
                  inviteLink={inviteLink}
                  groupData={group}
                  currentUserId={uid}
                  groupFriends={groupFriends}  
                  currentUserEmail={usersData[uid]?.email || ''}
                  currentUserImage={usersData[uid]?.image}
                  modalStateProps={{
                    isEditModalOpen,
                    setIsEditModalOpen,
                    onEditSuccess: handleEditSuccess
                  }}
                />
                <div className="mt-4">
                  <Balances
                    type="group"
                    groupData={group}   
                    currentUserId={uid}
                    groupId={group.id}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Container */}
          <div className="relative z-[9999]">
            <AddGroup
              isOpen={isEditModalOpen}
              closeModal={() => setIsEditModalOpen(false)}
              currentUserId={uid}
              currentUserImage={usersData[uid]?.image}
              friends={groupFriends} 
              email={usersData[uid]?.email || ''}
              onSuccess={handleEditSuccess}
              isEditing={true}
              editData={group}
              groupId={group.id}
            />
          </div>
        </BalancesProvider>
      </ExpenseProvider>
    </div>
  );
}