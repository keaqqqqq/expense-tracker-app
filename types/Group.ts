import { DocumentData } from "firebase/firestore";

export interface GroupMember {
    id?: string;
    name?: string;
    email?: string;
    status?: 'PENDING' | 'ACCEPTED';
    image?: string;
  }
  
export interface Group {
    id: string;
    type: string;
    name: string;
    image: string;
    members: GroupMember[];
  }
  
export interface FirestoreGroupData extends DocumentData {
    name: string;
    type: string;
    image: string;
    members: GroupMember[];
  }

