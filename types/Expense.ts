export interface Expense {
    id?: string; // Document ID from Firestore
    amount: number;
    category: string;
    created_at: string; // Timestamp or date string
    date: string; // Date of the expense
    description: string;
    group_id?: string; // Optional
    paid_by: string; // User ID or name of who paid
    split_preference?: string; // Optional
    created_by: string;
}
