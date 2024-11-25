export interface Balance {
    balance: number;
    id: string;
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
  balance: number;
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