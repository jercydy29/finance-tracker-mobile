export type TransactionType = 'expense' | 'income';

export type Transaction = {
    id: string;
    type: TransactionType;
    category: string;
    amount: string;
    description: string;
    date: string; // ISO date string (YYYY-MM-DD)
    receipt_url?: string;
};
