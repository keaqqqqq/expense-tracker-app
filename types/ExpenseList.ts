import { Expense } from "./Expense";
import { Transaction } from "./Transaction";
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export interface Splitter extends User {
  amount: number;
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
  groupDetails?: Record<string, string>; 
}