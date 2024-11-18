// app/groups/[id]/page.tsx
import React, { Suspense } from 'react';
import ExpenseCard from '@/components/ExpenseCard';
import { getGroupDetails, fetchGroupTransactions, fetchUserData } from '@/lib/actions/user.action';
import ExpenseList from '@/components/ExpenseList';
import { serializeFirebaseData } from '@/lib/utils';
import type { GroupedTransactions, Transaction } from '@/types/ExpenseList';
import { ExpenseProvider } from '@/context/ExpenseListContext';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface GroupDetailsPageProps {
  params: {
    id: string;
  }
}

export default async function GroupDetailsPage({ params }: GroupDetailsPageProps) {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/auth');
  }

  try {
    const [group, initialTransactions] = await Promise.all([
      getGroupDetails(params.id),
      fetchGroupTransactions(params.id)
    ]);

    if (!group) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Group not found</h2>
            <p className="mt-2 text-gray-600">The group you're looking for doesn't exist.</p>
          </div>
        </div>
      );
    }

    const memberIds = group.members
      .map(member => typeof member === 'string' ? member : member.id)
      .filter((id): id is string => id !== undefined);

    const transactionUserIds = initialTransactions
      .flatMap(group => group.transactions)
      .flatMap(t => [t.payer_id, t.receiver_id])
      .filter((id): id is string => id !== undefined);

    const userIds = new Set<string>([...memberIds, ...transactionUserIds]);

    const usersDataPromises = Array.from(userIds).map(async (userId) => {
      try {
        const userData = await fetchUserData(userId);
        return [userId, serializeFirebaseData(userData)];
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return [userId, { id: userId, name: userId }];
      }
    });

    console.log('Initial transactions: ' + initialTransactions)
    const usersDataArray = await Promise.all(usersDataPromises);
    const usersData = Object.fromEntries(usersDataArray);

    const balance = initialTransactions.reduce((total: number, group: GroupedTransactions) => {
      return group.transactions.reduce((subTotal: number, transaction: Transaction) => {
        if (transaction.payer_id === uid) {
          return subTotal + transaction.amount;
        } else if (transaction.receiver_id === uid) {
          return subTotal - transaction.amount;
        }
        return subTotal;
      }, total);
    }, 0);

    return (
        <div className="space-y-4">
        <ExpenseProvider 
          initialTransactions={initialTransactions}
          usersData={usersData}
        >
          <div>
            <ExpenseCard  
              name={group.name}
              amount={balance}
              type="group"
              memberCount={group.members.length}
              groupType={group.type}
              imageUrl={group.image}
            />
            <Suspense fallback={<div className="p-4 text-center">Loading expenses...</div>}>
              <ExpenseList currentUserId={uid}/>
            </Suspense>
          </div>
        </ExpenseProvider>
        </div>
    );
  } catch (error) {
    console.error('Error loading group details:', error);
    return (
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Error loading group</h2>
              <p className="mt-2 text-gray-600">Something went wrong while loading the group details.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}