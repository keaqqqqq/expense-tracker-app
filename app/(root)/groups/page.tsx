import GroupsContainer from '@/components/Groups/GroupsContainer'
import { loadFriends, getGroups } from '@/lib/actions/user.action';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserData } from '@/types/User';
import { fetchUserData } from '@/lib/actions/user.action';
import { Friend } from '@/types/Friend';
import { Group } from '@/types/Group';

export default async function Groups() {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/auth');
  }

  let userData: UserData | null = null;
  let friends: Friend[] = [];
  let groups: Group[] = [];

  if (uid) {
    try {
      userData = await fetchUserData(uid);
      
      if (userData?.email) {
        [friends, groups] = await Promise.all([
          loadFriends(uid),
          getGroups(userData.email)  
        ]);

      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (
    <div>
      <GroupsContainer 
        currentUserId={uid} 
        name={userData?.name} 
        friends={friends} 
        email={userData?.email}      
        initialGroups={groups}
      />
    </div>
  );
}