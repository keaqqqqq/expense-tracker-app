'use client'
import { useBalance } from '@/context/HomeBalanceContext';
import { HomeBalanceCard } from './HomeBalanceCard';
function BalanceList() {
  const { friendBalances } = useBalance();

  if (friendBalances.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No friend balances to show
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {friendBalances.map((friend) => (
        <HomeBalanceCard
          key={friend.friendId}
          friendId={friend.friendId}
          name={friend.name}
          image={friend.image}
          directBalance={friend.directBalance}
          groupBalances={friend.groups?.map(group => ({
            name: group.groupName,
            balance: group.netBalance
          }))}
          totalBalance={friend.totalBalance}
        />
      ))}
    </div>
  );
}

export default BalanceList;