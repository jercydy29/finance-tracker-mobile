import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Transaction } from '@/features/transactions/types';

export function useTransactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch transactions from Supabase
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw fetchError;
            }

            setTransactions(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Add a new transaction
    const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            const { data, error: insertError } = await supabase
                .from('transactions')
                .insert([transaction])
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            // Add to local state
            setTransactions((prev) => [data, ...prev]);
            return { success: true, data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add transaction';
            setError(errorMessage);
            console.error('Error adding transaction:', err);
            return { success: false, error: errorMessage };
        }
    };

    // Update an existing transaction
    const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
        try {
            const { data, error: updateError } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            // Update local state
            setTransactions((prev) =>
                prev.map((t) => (t.id === id ? { ...t, ...data } : t))
            );
            return { success: true, data };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
            setError(errorMessage);
            console.error('Error updating transaction:', err);
            return { success: false, error: errorMessage };
        }
    };

    // Delete a transaction
    const deleteTransaction = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            // Remove from local state
            setTransactions((prev) => prev.filter((t) => t.id !== id));
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
            setError(errorMessage);
            console.error('Error deleting transaction:', err);
            return { success: false, error: errorMessage };
        }
    };

    // Calculate totals
    const totals = transactions.reduce(
        (acc, transaction) => {
            const amount = parseFloat(transaction.amount);
            if (transaction.type === 'income') {
                acc.income += amount;
            } else {
                acc.expenses += amount;
            }
            acc.balance = acc.income - acc.expenses;
            return acc;
        },
        { income: 0, expenses: 0, balance: 0 }
    );

    // Fetch on mount
    useEffect(() => {
        fetchTransactions();
    }, []);

    return {
        transactions,
        loading,
        error,
        totals,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refetch: fetchTransactions,
    };
}
