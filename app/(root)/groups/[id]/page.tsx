import React from 'react';
import { getGroupDetails, fetchGroupTransactions, fetchUserData } from '@/lib/actions/user.action';
import { serializeFirebaseData } from '@/lib/utils';
import type { GroupedTransactions } from '@/types/ExpenseList';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFriendships } from '@/lib/actions/user.action';
import { fetchGroupBalances } from '@/lib/actions/user.action';
import { getOrCreateGroupInviteLink } from '@/lib/actions/user.action';
import { Transaction } from '@/types/Transaction';
import GroupDetailsClient from './GroupDetailsClient';
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
    const [group, initialTransactions, friendships, groupBalances] = await Promise.all([
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
            <p className="mt-2 text-gray-600">The group you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      );
    }

    const inviteToken = await getOrCreateGroupInviteLink(params.id, uid);
    const inviteLink = inviteToken ? `https://keaqqqqq.com/invite?token=${inviteToken}` : '';

    const memberIds = group.members
      .map(member => typeof member === 'string' ? member : member.id)
      .filter((id): id is string => id !== undefined);

      const transactionUserIds = initialTransactions.flatMap(group => {
        const transactionUsers = group.transactions.flatMap(t => [t.payer_id, t.receiver_id]);
        const expenseUsers = group.expense ? [
          ...(group.expense.payer?.map(p => p.id) || []),
          ...(group.expense.splitter?.map(s => s.id) || [])
        ] : [];
        return [...transactionUsers, ...expenseUsers];
      }).filter((id): id is string => id !== undefined);

    const friendIds = friendships
    .filter(rel => rel.type === 'friendship' && rel.status === 'ACCEPTED')
    .map(rel => rel.role === 'requester' ? rel.addressee_id : rel.requester_id) as string[];

    const allUserIds = new Set([
      uid,
      ...memberIds, 
      ...transactionUserIds, 
      ...friendIds 
    ]);
  
    const usersDataArray = await Promise.all(
      Array.from(allUserIds).map(async (userId) => {
        try {
          const userData = await fetchUserData(userId);
          return [userId, serializeFirebaseData(userData)];
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
          return [userId, { id: userId, name: userId }];
        }
      })
    );

  const usersData = Object.fromEntries(usersDataArray);
  
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
    console.log('User data: ' + JSON.stringify(groupBalances))

    return (
      <GroupDetailsClient
        group={group}
        uid={uid}
        groupFriends={groupFriends}
        usersData={usersData}
        balance={balance}
        initialTransactions={initialTransactions}
        groupBalances={groupBalances}
        inviteLink={inviteLink}
      />
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