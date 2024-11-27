import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { fetchAllFriendBalances } from '@/lib/actions/user.action';
import { HomeBalanceCard } from "@/components/Balances/HomeBalanceCard";
import { FriendBalance } from "@/types/Balance";
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
        <h1 className="text-2xl font-bold mb-6">Friend Balances</h1>
        {friendBalances.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {friendBalances.map((friend) => (
              <HomeBalanceCard
                key={friend.friendId}
                friendId={friend.friendId}
                name={friend.name}
                image={friend.image}
                directBalance={friend.directBalance}
                groupBalance={friend.groupBalance}
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