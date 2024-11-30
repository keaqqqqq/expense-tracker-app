import { Timestamp } from "firebase-admin/firestore";

export interface Friend {
  id: string;
  name: string;
  email: string;
  image: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: Timestamp;
}

export interface Relationship {
  id: string;
  type: 'friendship' | 'invitation';
  role: 'requester' | 'addressee';
  status: 'PENDING' | 'ACCEPTED';
  requester_id: string;
  addressee_id?: string;
  addressee_email?: string;
  created_at: Date;
  related_group_id?: string;
  related_group_name?: string;
}