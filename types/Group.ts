export interface GroupMember {
    id?: string;
    name?: string;
    email?: string;
    status?: 'ACTIVE' | 'PENDING_FRIENDSHIP' | 'PENDING_INVITATION' | 'PENDING';
    image?: string;
  }
  
export interface Group {
    id: string;
    type: string;
    name: string;
    image: string;
    members: GroupMember[];
    pending_members?: GroupMember[];
  }
  
export  interface FirestoreGroupData {
    name: string;
    type: string;
    image: string;
    members: GroupMember[];
    pending_members?: GroupMember[];
    creator_id: string;
    created_at: any;
  }
