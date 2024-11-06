import GroupsContainer from '@/components/Groups/GroupsContainer'
import { loadFriends } from '@/lib/actions/user.action';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserData } from '@/types/User';
import { fetchUserData } from '@/lib/actions/user.action';
import { Friend } from '@/types/Friend';
export default async function Groups() {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/auth');
  }

  let userData: UserData | null = null;
  let friends: Friend[] = [];

  if (uid) {
    try {
      [userData, friends] = await Promise.all([
        fetchUserData(uid),
        loadFriends(uid)
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (
    <GroupsContainer 
      currentUserId={uid} 
      name={userData?.name} 
      friends={friends} 
      email={userData?.email}
    />
  );
}