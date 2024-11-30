import { cookies } from "next/headers";
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Friend } from '@/types/Friend'; 
import { fetchUserData } from "@/lib/actions/user.action";
import { Group, FirestoreGroupData} from "@/types/Group";
import ClientWrapper from "@/components/Balances/ClientWrapper";

interface UserData {
    uid: string;
    email: string | null;
    name: string | null;
    image: string | null;
}

async function getInitialFriends(uid: string): Promise<Friend[]> {
    try {
        const friendships = [];
        const relationshipsRef = collection(db, 'Friendships');
        
        const requesterQuery = query(
            relationshipsRef,
            where('status', '==', 'ACCEPTED'),
            where('requester_id', '==', uid)
        );
        
        const addresseeQuery = query(
            relationshipsRef,
            where('status', '==', 'ACCEPTED'),
            where('addressee_id', '==', uid)
        );

        const [requesterDocs, addresseeDocs] = await Promise.all([
            getDocs(requesterQuery),
            getDocs(addresseeQuery)
        ]);

        const friendIds = new Set<string>();
        [...requesterDocs.docs, ...addresseeDocs.docs].forEach(doc => {
            const data = doc.data();
            friendIds.add(data.requester_id === uid ? data.addressee_id : data.requester_id);
        });

        const friendData = await Promise.all(
            Array.from(friendIds).map(async (friendId) => {
                const userDoc = await getDoc(doc(db, 'Users', friendId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    return {
                        id: friendId,
                        name: data.name || null,
                        image: data.image || null,
                        email: data.email || ''
                    };
                }
                return null;
            })
        );

        return friendData.filter((friend): friend is Friend => friend !== null);
    } catch (error) {
        console.error("Error fetching initial friends:", error);
        return [];
    }
}

async function getInitialGroups(uid: string, userEmail: string): Promise<Group[]> {
  try {
      const groupsRef = collection(db, 'Groups');
      
      const groupsSnapshot = await getDocs(groupsRef);
      
      const groupData = await Promise.all(
          groupsSnapshot.docs
              .filter(doc => {
                  const data = doc.data() as FirestoreGroupData;
                  return data.members?.some(member => member.email === userEmail) ||
                         data.pending_members?.some(member => member.email === userEmail);
              })
              .map(async (doc) => {
                  const data = doc.data() as FirestoreGroupData;
                  const group: Group = {
                      id: doc.id,
                      name: data.name || '',
                      image: data.image || '',
                      type: data.type,
                      members: data.members || [],
                      pending_members: data.pending_members || [],
                  };
                  return group;
              })
      );

      return groupData;
  } catch (error) {
      console.error("Error fetching initial groups:", error);
      return [];
  }
}


export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = cookies();
    const uid = cookieStore.get('currentUserUid')?.value;
    let userData: UserData | null = null;
    let initialFriends: Friend[] = [];
    let initialGroups: Group[] = [];

    if (uid) {
        try {
            const [userDataResult, friendsResult] = await Promise.all([
                fetchUserData(uid),
                getInitialFriends(uid)
            ]);
            
            if (userDataResult) {
                userData = {
                    uid,
                    email: userDataResult.email || null,
                    name: userDataResult.name || null,
                    image: userDataResult.image || null
                };
            }
            
            initialFriends = friendsResult;
            if (userData?.email) {
                initialGroups = await getInitialGroups(uid, userData.email);
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    }

    return (
        <ClientWrapper
            userData={userData}
            initialFriends={initialFriends}
            initialGroups={initialGroups}
        >
            {children}
        </ClientWrapper>
    );
}