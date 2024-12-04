'use client'
import React from 'react';
import { BalanceCard } from './BalanceCard';
import { Group } from '@/types/Group';
import { Friend } from '@/types/Friend';
import { useBalances } from '@/context/BalanceContext';
import { GroupBalance } from '@/types/Balance';
interface BalancesProps {
  type: 'friend' | 'group';
  groupData?: Group;
  friendData?: Friend;
  currentUserId: string;
  friendId?: string;
  groupId?: string;
}

export default function Balances({ 
  type, 
  friendData, 
  groupData, 
  currentUserId, 
  friendId, 
  groupId 
}: BalancesProps) {
  const {
    balances,
    groupBalances,
    friendGroupBalances,
    handleSettleBalance,
    refreshBalances,
  } = useBalances();

  React.useEffect(() => {
    if (type === 'friend' && friendId) {
      refreshBalances(currentUserId, friendId);
    } else if (type === 'group' && groupId) {
      refreshBalances(currentUserId);
    }
  }, [type, friendId, groupId, currentUserId, refreshBalances]);

  const friendBalance = friendId ? balances.find(b => b.id === friendId) : null;

  const groupMembers = React.useMemo(() => {
    if (!groupData?.members) return [];
  
    // Filter and map in one step to ensure non-null values
    const validMembers = groupData.members.reduce<GroupBalance[]>((acc, member) => {
      const memberId = typeof member === 'string' ? member : member.id;
      if (memberId === currentUserId) return acc;
  
      const memberBalance = groupBalances.find(b => b.memberId === memberId);

      if (memberBalance && 
        typeof memberBalance.settledBalance === 'number' && 
        typeof memberBalance.unsettledBalance === 'number' &&
        typeof memberBalance.netBalance === 'number') { 
      acc.push({
        ...memberBalance 
      });
    }
      
      return acc;
    }, []);

    return validMembers;
  }, [groupData?.members, currentUserId, groupBalances]);

  const canShowFriendBalance = type === 'friend' && friendData && friendBalance;
  const canShowGroupBalance = type === 'group' && groupData && groupId;
  const hasGroupBalancesToShow = friendGroupBalances && friendGroupBalances.length > 0;

  const hasFriendBalancesToShow = friendBalance?.netBalance !==0 || friendBalance.settledBalance !==0 || friendBalance.unsettledBalance !==0;
  return (
    <div className="space-y-4 xl:ml-10">
      {hasFriendBalancesToShow && (
        <h2 className="text-sm mb-4">
        {type === 'friend' ? 'Friend Balance' : 'Group Members Balance'}
        </h2>
      )}
      
      {canShowFriendBalance && friendBalance && (
        <>
          {/* Friend's direct balance */}
          <BalanceCard
            title="1:1 w/Friend"
            settledBalance={friendBalance.settledBalance || 0}
            unsettledBalance={friendBalance.unsettledBalance || 0}
            netBalance={friendBalance.netBalance || 0} 
            name={friendData.name}
            image={friendData.image}
            type="friend"
            onSettle={() => handleSettleBalance(currentUserId, friendData.id, 'friend')}
          />
          
          {/* Friend's group balances */}
          {friendGroupBalances && friendGroupBalances.length > 0 && (
            <>
              { hasGroupBalancesToShow &&               
              <h3 className="text-sm mb-3 mt-4 ml-2">Shared Group Balances</h3>
              }
              <div className="space-y-3">
                {friendGroupBalances.map((groupBalance) => (
                  <BalanceCard
                    key={`${groupBalance.groupId}-${groupBalance.memberId}`}
                    title={groupBalance.groupName}
                    settledBalance={groupBalance.settledBalance}
                    unsettledBalance={groupBalance.unsettledBalance}
                    netBalance={groupBalance.netBalance || 0} 
                    name={groupBalance.memberName}
                    image={groupBalance.groupImage}
                    type="group"
                    onSettle={() => handleSettleBalance(currentUserId, groupBalance.memberId, 'group')}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Group members balances */}
      {canShowGroupBalance && groupMembers.length > 0 && (
        <div className="space-y-3">
          {groupMembers.map((member) => (
            <BalanceCard
              key={member.memberId}
              title=""
              settledBalance={member.settledBalance}
              unsettledBalance={member.unsettledBalance}
              netBalance={member.netBalance || 0} // Add netBalan
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