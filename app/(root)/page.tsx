import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { fetchAllFriendBalances } from '@/lib/actions/user.action';
import HomeHeader from "@/components/HomePage/HomeHeader";
import { BalanceSummary } from "@/components/HomePage/BalanceSummary";
import { BalanceProvider } from "@/context/HomeBalanceContext";
import BalanceList from "@/components/HomePage/BalanceList";
async function HomePage() {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/login');
  }

  try {
    const friendBalances = await fetchAllFriendBalances(uid);
    
    return (
      <BalanceProvider initialBalances={friendBalances}>
        <div className="container mx-auto px-4 py-6">
          <BalanceSummary />
          <div className="mb-6">
            <HomeHeader />
          </div>
          <BalanceList />
        </div>
      </BalanceProvider>
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