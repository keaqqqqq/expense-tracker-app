import { DocumentData } from 'firebase/firestore';
import { fetchUserData } from "@/lib/actions/user.action";
import { Relationship } from '@/types/Friend';

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

const createDisplayInfo = (userData: FirestoreUserData | undefined, fallbackId: string) => {
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

const convertToUserData = (data: FirestoreUserData | undefined) => {
  if (!data) return undefined;
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    image: data.image
  };
};

export async function enrichRelationships(relationships: Relationship[], currentUserId: string) {
  return Promise.all(
    relationships.map(async (relationship) => {
      let requesterData: FirestoreUserData | undefined;
      let addresseeData: FirestoreUserData | undefined;
      
      try {
        if (relationship.requester_id !== currentUserId) {
          requesterData = await fetchUserData(relationship.requester_id) as FirestoreUserData;
        }
        
        if (relationship.addressee_id && relationship.addressee_id !== currentUserId) {
          addresseeData = await fetchUserData(relationship.addressee_id) as FirestoreUserData;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

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
}

 export {
  getInitials,
  createDisplayInfo,
  convertToUserData
};