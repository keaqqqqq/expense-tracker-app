export interface UserData {
  id?: string;
  name?: string;
  email?: string;
  image?: string | '';
  balances: {
    [key: string]: FirestoreBalance;
  };
}

interface FirestoreBalance {
  balance: number;
}
