import { SplitFriend } from "./SplitFriend";

export interface Transaction {
    id:string; // Document ID from Firestore
    amount: number;
    type?: string | '';
    created_at: string; // Timestamp or date string
    payer_id: string;
    receiver_id: string;
    group_id: string | null; // Optional
    expense_id: string | null;
}