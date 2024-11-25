import React, { Suspense } from 'react';
import { fetchUserData } from '@/lib/actions/user.action';
import ExpenseList from '@/components/ExpenseList';
import { serializeFirebaseData } from '@/lib/utils';
import type { GroupedTransactions } from '@/types/ExpenseList';
import { ExpenseProvider } from '@/context/ExpenseListContext';
import { fetchTransactions } from '@/lib/actions/user.action';
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { User} from 'lucide-react';
import ManageFriend from '@/components/Friends/ManageFriend';
import { Relationship } from '@/types/Friend';
import { getFriendships } from '@/lib/actions/user.action';
import { fetchUserBalances, fetchFriendGroupBalances } from '@/lib/actions/user.action';
import { BalancesProvider } from '@/context/BalanceContext';
import Balances from '@/components/Balances/Balance';
import ExpenseCard from '@/components/ExpenseCard';
import { Transaction } from '@/types/Transaction';
interface Props {
  params: {
    id: string;
  }
}

async function FriendDetails({ params }: Props) {

  const PendingStatusUI = () => (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Request / Invitation Pending
            </h2>
            <p className="text-gray-500 mb-4">
              This friend isn't accessible until the friend request is accepted.
            </p>
            <ul className="text-sm text-gray-500 mb-6 space-y-2 text-left max-w-sm mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                Request is still under consideration
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                Invitation acceptance is pending
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                Expense sharing will be available after acceptance
              </li>
            </ul>
            <div className="mt-2 flex flex-col gap-3 items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                Awaiting response
              </span>
              <BackButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!params.id || params.id === 'undefined') {
    return <PendingStatusUI />;
  }

  try {
    const cookieStore = cookies();
    const uid = cookieStore.get('currentUserUid')?.value;
  
    if (!uid) {
      redirect('/login');
    }

    const relationships = await getFriendships(uid);
    const friendship = relationships.find((rel: Relationship) => 
      (rel.requester_id === params.id || rel.addressee_id === params.id) &&
      rel.status === 'ACCEPTED'
    );

    if (!friendship) {
      return <PendingStatusUI />;
    }

    const [
      rawUserData, 
      initialTransactions,
      userBalances,
      initialFriendGroupBalances
    ] = await Promise.all([
      fetchUserData(params.id),
      fetchTransactions(uid, params.id),
      fetchUserBalances(uid),
      fetchFriendGroupBalances(uid, params.id) 
    ]);

    const userIds = new Set<string>();
    initialTransactions.forEach((group: GroupedTransactions) => {
      group.transactions.forEach((transaction: Transaction) => {
        userIds.add(transaction.payer_id);
        userIds.add(transaction.receiver_id);
      });
      
      if (group.expense) {
        group.expense.payer?.forEach(payer => {
          userIds.add(payer.id);
        });
        group.expense.splitter?.forEach(splitter => {
          userIds.add(splitter.id);
        });
      }
    });
    
    const usersDataPromises = Array.from(userIds).map(async (userId) => {
      try {
        const userData = await fetchUserData(userId);
        return [userId, serializeFirebaseData(userData)];
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return [userId, { id: userId, name: userId }];
      }
    });
    
    const usersDataArray = await Promise.all(usersDataPromises);
    const usersData = Object.fromEntries(usersDataArray);
    
    const balance = initialTransactions.reduce((total: number, group: GroupedTransactions) => {
      return group.transactions.reduce((subTotal: number, transaction: Transaction) => {
        if (transaction.payer_id === params.id) {
          return subTotal - transaction.amount;
        } else if (transaction.receiver_id === params.id) {
          return subTotal + transaction.amount;
        }
        return subTotal;
      }, total);
    }, 0);

    const userData = serializeFirebaseData(rawUserData);
      return (
        <ExpenseProvider 
          initialTransactions={initialTransactions}
          usersData={usersData}
        >
          <BalancesProvider 
            userId={uid}
            initialBalances={userBalances}
            initialFriendGroupBalances={initialFriendGroupBalances}
          >
            <div className="grid md:grid-cols-4 gap-5 xl:gap-0">
              <div className="md:col-span-3">
                <div className="flex flex-col gap-2">
                  <ExpenseCard  
                    name={userData.name}
                    amount={balance}
                    type="user"
                    avatarUrl={userData.image || '/default-avatar.jpg'}
                    friendId={params.id}
                  />
                  <Suspense fallback={<div className="text-center">Loading expenses...</div>}>
                    <ExpenseList currentUserId={uid}/>
                  </Suspense>
                </div>
              </div>
              
              <div className="md:col-span-1 space-y-4">
                <div className="sticky top-4">
                  <ManageFriend
                    friendId={params.id}
                    friendName={userData.name}
                    currentUserId={uid}
                  />
                  <div className="mt-4">
                    <Balances
                      type="friend"
                      friendData={userData}
                      currentUserId={uid}
                      friendId={params.id}
                    />
                  </div>
                </div>
              </div>
            </div>
          </BalancesProvider>
        </ExpenseProvider>
    );
  } catch (error) {
    console.error('Error fetching data:', error);
    return (
      <div className="p-4 text-red-500">
        Error: {error instanceof Error ? error.message : 'Failed to load data'}
      </div>
    );
  }
}

export default FriendDetails;