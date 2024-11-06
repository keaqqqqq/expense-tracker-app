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
  created_at: any; // or more specific timestamp type
}