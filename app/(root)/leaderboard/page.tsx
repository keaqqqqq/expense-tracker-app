import { Leaderboard } from '@/components/Leaderboard'; 
import { getFriendsLeaderboardData } from '@/lib/actions/user.action';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export default async function LeaderboardPage() {
  try {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/auth');
  }

    const leaderboardData = await getFriendsLeaderboardData(uid);

    return (
      <div className="p-4 max-w-7xl mx-auto bg-white">
        <h1 className="text-sm sm:text-base mb-6">Leaderboard</h1>
        <Leaderboard users={leaderboardData} />
      </div>
    );
  } catch (error) {
    console.error('Error in LeaderboardPage:', error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center text-red-600">
          Error loading leaderboard data
        </h1>
      </div>
    );
  }
}