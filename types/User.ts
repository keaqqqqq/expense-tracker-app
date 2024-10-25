export interface UserData {
  name?: string;
  email?: string;
  image?: string | null;
  memberList?: Array<{ email: string }>;
}
