export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  image?: string | null;
  memberList?: Array<{ email: string }>;
}
