import ManageExpense from '@/components/ManageExpense/ManageExpense';
import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from "next/headers";
import { ExpenseProvider } from '@/context/ExpenseListContext';
import { 
    fetchAllTransactions,
    fetchUserData,
    getFriendships,
    getGroups 
} from '@/lib/actions/user.action';
import { serializeFirebaseData } from '@/lib/utils';

const ExpensePage = async () => {
    const cookieStore = cookies();
    const uid = cookieStore.get('currentUserUid')?.value;
  
    if (!uid) {
        redirect('/auth');
    }

    try {
        const currentUserData = await fetchUserData(uid);
        const userEmail = currentUserData.email;

        if (!userEmail) {
            throw new Error('User email not found');
        }

        const [relationships, groups] = await Promise.all([
            getFriendships(uid),
            getGroups(userEmail)
        ]);

        const friendIds = relationships
            .filter(rel => 
                rel.type === 'friendship' && 
                rel.status === 'ACCEPTED' &&
                (rel.requester_id || rel.addressee_id)
            )
            .map(rel => rel.role === 'requester' ? rel.addressee_id : rel.requester_id)
            .filter((id): id is string => id !== undefined);

        const groupIds = groups
            .filter(group => group.members.some(member => member.id === uid))
            .map(group => group.id)
            .filter((id): id is string => id !== undefined);
        
        const groupDetails = groups.reduce((acc, group) => {
            if (group.id) {
                acc[group.id] = group.name;
            }
            return acc;
        }, {} as Record<string, string>);

        const allTransactions = await fetchAllTransactions(uid, friendIds, groupIds);

        const userIds = new Set<string>([uid]); 
        allTransactions.forEach(group => {
            group.transactions.forEach(t => {
                userIds.add(t.payer_id);
                userIds.add(t.receiver_id);
            });
            
            if (group.expense) {
                group.expense.payer?.forEach(p => userIds.add(p.id));
                group.expense.splitter?.forEach(s => userIds.add(s.id));
            }
        });

        groups.forEach(group => {
            group.members.forEach(member => {
                if (member.id) userIds.add(member.id);
            });
        });

        const usersDataArray = await Promise.all(
            Array.from(userIds).map(async userId => {
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
        
        return (
            <ExpenseProvider 
                initialTransactions={allTransactions}
                usersData={usersData}
                groupDetails={groupDetails} 
            >
                <ManageExpense 
                    uid={uid} 
                    friendIds={friendIds}
                    groupIds={groupIds}
                />
            </ExpenseProvider>
        );
    } catch (error) {
        console.error('Error fetching expense data:', error);
        return (
            <div className="container mx-auto px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow p-8">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900">Error loading expenses</h2>
                            <p className="mt-2 text-gray-600">Something went wrong while loading your expenses.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
};

export default ExpensePage;