'use client'
import React from 'react';
import { BalanceCard } from './BalanceCard';
import { useBalances } from '@/context/BalanceContext';
interface BalancesProps {
  type: 'friend' | 'group';
  userData: {
    id: string;
    name: string;
    image?: string;
  };
  currentUserId: string;
  friendId: string; 

}

export default function Balances({ type, userData, currentUserId, friendId }: BalancesProps) {
  const { 
    balances, 
    groupBalances, 
    handleSettleBalance,
  } = useBalances();
  
  const friendBalance = balances.find(b => b.id === friendId)?.balance || 0;

  return (
    <div className="space-y-4">
      <h2 className="text-sm mb-4">
        {type === 'friend' ? 'Friend Balance' : 'Group Balance'}
      </h2>

      {type === 'friend' && (
        <>
          <BalanceCard
            title="1:1 w/Friend"
            balance={friendBalance}  
            name={userData.name}
            image={userData.image}
            type="friend"
            onSettle={() => handleSettleBalance(currentUserId, userData.id, 'friend')}
          />
          
          {groupBalances && groupBalances.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">In Groups</h3>
              <div className="space-y-3">
                {groupBalances.map((group) => (
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
              </div>
            </div>
          )}
        </>
      )}

      {type === 'group' && (
        <div className="space-y-3">
          {balances.map((balance) => (
            <BalanceCard
              key={balance.id}
              title="Member Balance"
              balance={balance.balance}
              name={userData.name}
              image={userData.image}
              type="group"
              onSettle={() => handleSettleBalance(currentUserId, balance.id, 'group')}
            />
          ))}
        </div>
      )}
    </div>
  );
}