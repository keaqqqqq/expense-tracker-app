export interface GroupMember {
    id?: string;
    name?: string;
    email?: string;
    status?: 'PENDING' | 'ACCEPTED';

  }
  
export interface Group {
    id?: string;
    type: 'trip' | 'house' | 'couple' | 'party' | 'business' | 'other';
    name: string;
    image: string;
    members: GroupMember[];
  }
  