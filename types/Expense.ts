import { SplitFriend } from "./SplitFriend";

export interface Expense {
    id?: string; // Document ID from Firestore
    amount: number;
    category: string;
    created_at: string; // Timestamp or date string
    date: string; // Date of the expense
    description: string;
    group_id?: string; // Optional
    split_preference?: string;
    pay_preference?: string;
    splitter:{id:string, amount:number}[]; 
    split_data?:{
        id: string,
        value: number,
    }[];
    payer:{id:string, amount:number}[]; 
    created_by?: string;
}