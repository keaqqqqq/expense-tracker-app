import { getFriendships, fetchUserData } from "@/lib/actions/user.action"
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { FriendsProvider } from '@/context/FriendsContext';
import FriendsContainer from "@/components/Friends/FriendsContainer";
import { enrichRelationships } from "@/lib/relationship-utils";
export default async function Friends() {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/login');
  }

  // Get initial data from server
  const relationships = await getFriendships(uid);
  const enrichedInitialRelationships = await enrichRelationships(relationships, uid);

  return (
    <div>
      <FriendsProvider initialRelationships={enrichedInitialRelationships}>
        <FriendsContainer />
      </FriendsProvider>
    </div>
  );
}
