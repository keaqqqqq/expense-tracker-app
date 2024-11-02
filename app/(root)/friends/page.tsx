// app/friends/page.tsx
import { getFriendships, acceptFriendship, fetchUserData } from "@/lib/actions/user.action"
import FriendList from "@/components/Friends/FriendList"
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { DocumentData } from 'firebase/firestore';
import { UserData, DisplayUserInfo } from "@/components/Friends/FriendList";
import AddFriend from "@/components/UserProfile/AddFriend";
import FriendsContainer from "@/components/Friends/FriendsContainer";

interface FirestoreUserData extends DocumentData {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

const getInitials = (name: string = '') => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const createDisplayInfo = (userData: FirestoreUserData | undefined, fallbackId: string): DisplayUserInfo => {
  if (!userData) {
    return {
      avatar: {
        fallback: getInitials(fallbackId),
        alt: 'Profile',
      },
      displayName: fallbackId
    };
  }

  return {
    avatar: {
      image: userData.image,
      fallback: userData.name ? getInitials(userData.name) : getInitials(userData.email),
      alt: userData.name || userData.email,
    },
    displayName: userData.name || userData.email
  };
};

const convertToUserData = (data: FirestoreUserData | undefined): UserData | undefined => {
  if (!data) return undefined;
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    image: data.image
  };
};

export default async function Friends() {
  const cookieStore = cookies();
  const uid = cookieStore.get('currentUserUid')?.value;

  if (!uid) {
    redirect('/login');
  }

  const relationships = await getFriendships(uid);

  const enrichedRelationships = await Promise.all(
    relationships.map(async (relationship) => {
      let requesterData: FirestoreUserData | undefined;
      let addresseeData: FirestoreUserData | undefined;
      
      try {
        if (relationship.requester_id !== uid) {
          requesterData = await fetchUserData(relationship.requester_id) as FirestoreUserData;
        }
        
        if (relationship.addressee_id && relationship.addressee_id !== uid) {
          addresseeData = await fetchUserData(relationship.addressee_id) as FirestoreUserData;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      // Determine which user's info to display based on role
      const displayData = relationship.role === 'addressee'
        ? { userData: requesterData, fallbackId: relationship.requester_id }
        : { userData: addresseeData, fallbackId: relationship.addressee_id || relationship.addressee_email || 'Unknown' };

      return {
        ...relationship,
        requesterData: convertToUserData(requesterData),
        addresseeData: convertToUserData(addresseeData),
        displayInfo: createDisplayInfo(displayData.userData, displayData.fallbackId)
      };
    })
  );

  return (
    <div className="container mx-auto p-4">
      <FriendsContainer />
      <FriendList 
        relationships={enrichedRelationships}
        onAcceptRequest={acceptFriendship}
      />
    </div>
  );
} 