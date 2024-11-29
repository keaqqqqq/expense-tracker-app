export interface GroupMember {
    id?: string;
    name?: string;
    email?: string;
    status?: 'ACTIVE' | 'PENDING_FRIENDSHIP' | 'PENDING_INVITATION' | 'PENDING';
    image?: string;
    balances?: {
      [key: string]: {
        balance: number;
      };
    };
  }

export interface Balance {
  id? :string;
  balance: number;
}
  
export interface Group {
    id: string;
    type: string;
    name: string;
    image?: string;
    members: GroupMember[];
    pending_members?: GroupMember[];
  }
  
export  interface FirestoreGroupData {
    name: string;
    type: string;
    image?: string;
    members: GroupMember[];
    pending_members?: GroupMember[];
  }

export type GroupType = 'trip' | 'house' | 'couple' | 'party' | 'business' | 'other' | string;

