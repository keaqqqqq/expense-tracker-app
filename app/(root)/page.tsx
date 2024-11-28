import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { fetchAllFriendBalances } from '@/lib/actions/user.action';
import { FriendBalance } from "@/types/Balance";
import HomeHeader from "@/components/HomePage/HomeHeader";
import { HomeBalanceCard } from "@/components/HomePage/HomeBalanceCard";
import { BalanceSummary } from "@/components/HomePage/BalanceSummary";
async function HomePage() {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/login');
  }

  try {
    const friendBalances: FriendBalance[] = await fetchAllFriendBalances(uid);
    
    return (
      <div className="container mx-auto px-4 py-6">
        
        <BalanceSummary friendBalances={friendBalances} />

        <div className="mb-6">
          <HomeHeader />
        </div>
        
        {friendBalances.length > 0 ? (
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
        ) : (
          <div className="text-gray-500 text-center py-8">
            No friend balances to show
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading friend balances:', error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-red-500">
          Error loading balances: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }
}

export default HomePage;