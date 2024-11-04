import { Expense } from "./Expense";

export interface SplitInterface {
  expense: Omit<Expense, 'id'>
}
