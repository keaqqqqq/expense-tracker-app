// types/expense.ts
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export interface Transaction {
  expense_id: string | null;
  payer_id: string;
  receiver_id: string;
  type: 'expense' | 'settle' | string;
  amount: number;
  group_id: string | null;
  created_at: string;  // Ensure this is typed as string
}

export interface Splitter extends User {
  amount: number;
}

export interface Expense {
  expense_id: string;
  description: string;
  amount: number;
  category: string;
  created_at: string;
  created_by: string;
  group_id: string | null;
  date: string;
  payer: Splitter[];
  split_preference: string;
  splitter: Splitter[];
}

export interface GroupedTransactions {
  expense?: Expense;
  transactions: Transaction[];
}

export interface ExpenseContextType {
  groupedTransactions: GroupedTransactions[];
  isLoading: boolean;
  refreshTransactions: (userId: string) => Promise<void>;
}

export interface ExpenseProviderProps {
  children: React.ReactNode;
  initialTransactions: GroupedTransactions[];
}