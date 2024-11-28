export interface Balance {
    balance?: number;
    id: string;
    settledBalance?: number;
    unsettledBalance?: number;
    netBalance?: number;
  }

export  interface BalanceDetails {
    totalAmount: number;  
    netAmount: number;    
  }

  export interface GroupBalance {
    groupId: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    memberId: string;
    memberName: string;
    memberImage: string;
    memberEmail: string;
    settledBalance: number;
    unsettledBalance: number;
    netBalance: number;
}

export interface FriendGroupBalance {
    groupId: string;
    groupName: string;
    groupImage: string;
    userId: string;
    userName: string;
    userEmail: string;
    memberId: string;
    memberName: string;
    memberImage: string;
    memberEmail: string;
    settledBalance: number;
    unsettledBalance: number;
    netBalance: number;
}

export interface FriendBalance {
    friendId: string;
    name: string;
    image?: string;
    directBalance: number;
    groupBalance: number;
    totalBalance: number;
    groups: FriendGroupBalance[];
  }