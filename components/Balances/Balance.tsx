'use client'
import React from 'react';
import { BalanceCard } from './BalanceCard';
import { useBalances } from '@/context/BalanceContext';
import { Group } from '@/types/Group';
import { Friend } from '@/types/Friend';

interface BalancesProps {
  type: 'friend' | 'group';
  groupData?: Group;
  friendData?: Friend;
  currentUserId: string;
  friendId?: string;
  groupId?: string;
}

export default function Balances({ type, friendData, groupData, currentUserId, friendId, groupId }: BalancesProps) {
  const {
    balances,
    groupBalances,
    handleSettleBalance,
  } = useBalances();

  const friendBalance = friendId ? balances.find(b => b.id === friendId)?.balance || 0 : 0;

  const groupMembers = React.useMemo(() => {
    if (!groupData?.members) return [];
  
    return groupData.members
      .map(member => {
        const memberId = typeof member === 'string' ? member : member.id;
        if (memberId === currentUserId) return null;
  
        const memberBalance = groupBalances.find(b => b.memberId === memberId);
        
        return memberBalance ? {
          groupId: memberBalance.groupId,
          userId: memberBalance.userId,
          userName: memberBalance.userName,
          userEmail: memberBalance.userEmail,
          memberId: memberBalance.memberId,
          memberName: memberBalance.memberName,
          memberImage: memberBalance.memberImage,
          memberEmail: memberBalance.memberEmail,
          memberBalance: memberBalance.memberBalance
        } : null;
      })
      .filter((member): member is {
        groupId: string;
        userId: string;
        userName: string;
        userEmail: string;
        memberId: string;
        memberName: string;
        memberImage: string;
        memberEmail: string;
        memberBalance: number;
      } => member !== null);
  }, [groupData?.members, currentUserId, groupBalances]);

  const canShowFriendBalance = type === 'friend' && friendData;
  const canShowGroupBalance = type === 'group' && groupData && groupId;

  return (
    <div className="space-y-4 xl:ml-10">
      <h2 className="text-sm mb-4">
        {type === 'friend' ? 'Friend Balance' : 'Group Members Balance'}
      </h2>

      {canShowFriendBalance && (
        <>
          <BalanceCard
            title="1:1 w/Friend"
            balance={friendBalance}
            name={friendData.name}
            image={friendData.image}
            type="friend"
            onSettle={() => handleSettleBalance(currentUserId, friendData.id, 'friend')}
          />

          {/* <h3 className="text-lg font-medium mb-3 mt-4">In Groups</h3>
          <div className="space-y-3">
            {groupBalances && groupBalances.map((group) => (
              <BalanceCard
                key={group.groupId}
                title={group.name}
                balance={group.balance}
                name={group.name}
                image={group.image}
                type="group"
                onSettle={() => handleSettleBalance(currentUserId, group.groupId, 'group')}
              />
            ))}
          </div> */}
        </>
      )}
      {canShowGroupBalance && (
        <div className="space-y-3">
          {groupMembers.map((member) => (
            <BalanceCard
              key={member.memberId}
              title={``}
              balance={member.memberBalance}
              name={member.memberName}
              image={member.memberImage}
              type="group"
              onSettle={() => handleSettleBalance(currentUserId, member.memberId, 'group')}
            />
          ))}
        </div>
      )}
    </div>
  );
}