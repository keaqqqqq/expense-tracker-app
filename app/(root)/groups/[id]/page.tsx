import React, { Suspense } from 'react';
import ExpenseCard from '@/components/ExpenseCard';
import { getGroupDetails, fetchGroupTransactions, fetchUserData } from '@/lib/actions/user.action';
import ExpenseList from '@/components/ExpenseList';
import { serializeFirebaseData } from '@/lib/utils';
import type { GroupedTransactions, Transaction } from '@/types/ExpenseList';
import { ExpenseProvider } from '@/context/ExpenseListContext';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ManageGroup from '@/components/Groups/ManageGroup';
import { getFriendships } from '@/lib/actions/user.action';
import Balances from '@/components/Balances/Balance';
import { fetchGroupBalances } from '@/lib/actions/user.action';
import { BalancesProvider } from '@/context/BalanceContext';
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
    const [group, initialTransactions, friendships, userBalances] = await Promise.all([
      getGroupDetails(params.id),
      fetchGroupTransactions(params.id),
      getFriendships(uid),
      fetchGroupBalances(uid, params.id), 
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

    const friendIds = friendships
    .filter(rel => rel.type === 'friendship' && rel.status === 'ACCEPTED')
    .map(rel => rel.role === 'requester' ? rel.addressee_id : rel.requester_id) as string[];
  
    const usersDataArray = await Promise.all([uid, ...friendIds].map(async (userId) => {
      try {
        const userData = await fetchUserData(userId);
        return [userId, serializeFirebaseData(userData)];
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return [userId, { id: userId, name: userId }];
      }
    }));
  const usersData = Object.fromEntries(usersDataArray);
  
  // Transform to Friend type
  const groupFriends = friendships
    .filter(rel => rel.type === 'friendship' && rel.status === 'ACCEPTED')
    .map(rel => {
      const friendId = rel.role === 'requester' ? rel.addressee_id : rel.requester_id;
      const userData = usersData[friendId as string];
      return {
        id: friendId as string,
        name: userData?.name || 'Unknown User',
        email: userData?.email || '',
        image: userData?.image || '/default-avatar.jpg'
      };
    });

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

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/groups/join/${params.id}`;
    console.log('Group balances: ' + JSON.stringify(userBalances))
    return (
      <div>
        <ExpenseProvider 
          initialTransactions={initialTransactions}
          usersData={usersData}
        >
         <BalancesProvider
            userId={uid}
            initialGroupBalances={userBalances} 
            groupId={params.id}
          >
          <div className="grid md:grid-cols-4 gap-5 xl:gap-0">
            <div className="md:col-span-3">
              <div className="flex flex-col gap-2">
                <ExpenseCard  
                  name={group.name}
                  amount={balance}
                  type="group"
                  memberCount={group.members.length}
                  groupType={group.type}
                  imageUrl={group.image}
                />
                <Suspense fallback={<div className="text-center">Loading expenses...</div>}>
                  <ExpenseList currentUserId={uid}/>
                </Suspense>
              </div>
            </div>
            
            <div className="md:col-span-1 space-y-4">
              <div className="sticky top-4">
                <ManageGroup 
                  groupId={params.id}
                  groupName={group.name}
                  inviteLink={inviteLink}
                  groupData={{
                    type: group.type,
                    name: group.name,
                    image: group.image,
                    members: group.members
                  }}
                  currentUserId={uid}
                  groupFriends={groupFriends}  
                  currentUserEmail={usersData[uid]?.email || ''}
                  currentUserImage={usersData[uid]?.image}
                  />
                  <div className="mt-4">
                  <Balances
                    type="group"
                    groupData={group}    // Pass the group data
                    currentUserId={uid}
                    groupId={params.id}
                  />
                  </div>
              </div>
            </div>
          </div>
          </BalancesProvider>
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