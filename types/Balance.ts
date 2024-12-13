export interface Balance {
    balance?: number;
    id: string;
    settledBalance?: number;
    unsettledBalance?: number;
    netBalance?: number;
    directPaymentBalance?: number;
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
    directPaymentBalance?: number;
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
    directPaymentBalance?: number;
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

export interface SettlementBalance {
  expense_id: string;
  payer: string;
  receiver: string;
  amount: number;
  group_id: string;
}