import Sidebar from "@/components/Sidebar";
import { cookies } from "next/headers";
import TopBar from "@/components/Topbar";
import { fetchUserData } from "@/lib/actions/user.action";
import { UserData } from '@/types/User';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { getFriendships } from "@/lib/actions/user.action";
import { getGroups } from "@/lib/actions/user.action";

interface SidebarFriend {
  id: string;
  name?: string;
  email: string;
  image?: string;
}

interface SidebarGroup {
  id: string;
  name: string;
  image?: string;
  type: string;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  let userData: UserData | null = null;
  let sidebarFriends: SidebarFriend[] = [];
  let sidebarGroups: SidebarGroup[] = [];

  if (uid) {
    try {
      userData = await fetchUserData(uid);

      if (userData?.email) {
        const [relationships, groupsData] = await Promise.all([
          getFriendships(uid),
          getGroups(userData.email)
        ]);

        const acceptedFriendships = relationships.filter(
          rel => rel.type === 'friendship' && rel.status === 'ACCEPTED'
        );

        const userIds = new Set<string>();
        acceptedFriendships.forEach(friendship => {
          if (friendship.role === 'requester' && friendship.addressee_id) {
            userIds.add(friendship.addressee_id);
          } else if (friendship.role === 'addressee' && friendship.requester_id) {
            userIds.add(friendship.requester_id);
          }
        });

        const usersRef = collection(db, 'Users');
        const userDataMap = new Map<string, { name: string, image: string }>();
        
        for (let i = 0; i < Array.from(userIds).length; i += 10) {
          const batch = Array.from(userIds).slice(i, i + 10);
          const usersQuery = query(usersRef, where(documentId(), 'in', batch));
          const usersSnapshot = await getDocs(usersQuery);
          
          usersSnapshot.forEach(doc => {
            const userData = doc.data();
            userDataMap.set(doc.id, {
              name: userData.name || '',
              image: userData.image || ''
            });
          });
        }

        sidebarFriends = acceptedFriendships.map(friendship => {
          const friendId = friendship.role === 'requester' ? 
            friendship.addressee_id : 
            friendship.requester_id;
          
          const friendData = friendId ? userDataMap.get(friendId) : undefined;

          return {
            id: friendId || friendship.id,
            name: friendData?.name || (friendship.role === 'requester' ? 
              friendship.addressee_email?.split('@')[0] : 
              friendship.requester_id.split('@')[0]),
            email: friendship.role === 'requester' ? 
              friendship.addressee_email || '' : 
              friendship.requester_id,
            image: friendData?.image
          };
        });

        sidebarGroups = groupsData
          .filter(group => group.members.some(member => member.email === userData?.email))
          .map(group => ({
            id: group.id,
            name: group.name,
            type: group.type,
            image: group.image
          }));
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar  
        name={userData?.name || null} 
        image={userData?.image || null} 
        friends={sidebarFriends}
        groups={sidebarGroups}
      />
      <div className="flex flex-col flex-1 md:ml-64">
        <div className="hidden md:block">
          <TopBar name={userData?.name || null} image={userData?.image || null} />
        </div>
        <div className="p-4 flex-1 sm:p-8 mt-16 md:mt-0">
          {children}
        </div>
      </div>
    </main>
  );
}