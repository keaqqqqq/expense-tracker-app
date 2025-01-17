import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { FriendsProvider } from '@/context/FriendsContext';
import FriendsContainer from "@/components/Friends/FriendsContainer";
import { enrichRelationships } from "@/lib/relationship-utils";
import { fetchAllFriendBalances } from "@/lib/actions/balance";
import { getFriendships } from "@/lib/actions/friend.action";
export default async function Friends() {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/auth');
  }

  const [relationships, balances] = await Promise.all([
    getFriendships(uid),
    fetchAllFriendBalances(uid)
  ]);
  
  const enrichedInitialRelationships = await enrichRelationships(relationships, uid);

  return (
    <div>
      <FriendsProvider initialRelationships={enrichedInitialRelationships}>
        <FriendsContainer initialBalances={balances} />
      </FriendsProvider>
    </div>
  );
}