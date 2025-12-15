import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { Transaction } from '@/features/transactions/types';
import { useMonth } from '@/contexts/MonthContext';

const PAGE_SIZE = 10;

export function useTransactions() {
    // Use shared month state from context
    const {
        selectedMonth,
        setMonth,
        goToPreviousMonth,
        goToNextMonth,
        isCurrentMonth,
        monthLabel,
    } = useMonth();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Totals for selected month
    const [totals, setTotals] = useState({ income: 0, expenses: 0, balance: 0 });
    
    // Available months with transactions (for month picker)
    const [availableMonths, setAvailableMonths] = useState<Set<string>>(new Set());
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Fetch available months (months that have transactions)
    const fetchAvailableMonths = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('date');

            if (fetchError) throw fetchError;

            const monthsSet = new Set<string>();
            const yearsSet = new Set<number>();

            (data || []).forEach((t) => {
                const date = new Date(t.date);
                const year = date.getFullYear();
                const month = date.getMonth();
                monthsSet.add(`${year}-${month}`); // e.g., "2025-11" for December
                yearsSet.add(year);
            });

            setAvailableMonths(monthsSet);
            setAvailableYears(Array.from(yearsSet).sort((a, b) => a - b));
        } catch (err) {
            console.error('Error fetching available months:', err);
        }
    }, []);

    // Get date range for selected month
    const getMonthDateRange = useCallback(() => {
        const startDate = new Date(selectedMonth.year, selectedMonth.month, 1);
        const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0); // Last day of month
        
        return {
            start: startDate.toISOString().split('T')[0], // YYYY-MM-DD
            end: endDate.toISOString().split('T')[0],
        };
    }, [selectedMonth]);

    // Fetch totals for selected month
    const fetchTotals = useCallback(async () => {
        try {
            const { start, end } = getMonthDateRange();
            
            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('type, amount')
                .gte('date', start)
                .lte('date', end);

            if (fetchError) throw fetchError;

            const calculated = (data || []).reduce(
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
            setTotals(calculated);
        } catch (err) {
            console.error('Error fetching totals:', err);
        }
    }, [getMonthDateRange]);

    // Fetch first page of transactions for selected month
    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setHasMore(true);

            const { start, end } = getMonthDateRange();

            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .range(0, PAGE_SIZE - 1);

            if (fetchError) throw fetchError;

            setTransactions(data || []);
            setHasMore((data || []).length === PAGE_SIZE);
            
            // Also refresh totals
            fetchTotals();

            // Refresh available months
            fetchAvailableMonths();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [getMonthDateRange, fetchTotals, fetchAvailableMonths]);

    // Load more transactions (next page)
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        try {
            setLoadingMore(true);
            const offset = transactions.length;
            const { start, end } = getMonthDateRange();

            const { data, error: fetchError } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', start)
                .lte('date', end)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            if (fetchError) throw fetchError;

            if (data && data.length > 0) {
                setTransactions((prev) => {
                    // Deduplicate: only add items that don't already exist
                    const existingIds = new Set(prev.map((t) => t.id));
                    const newItems = data.filter((t) => !existingIds.has(t.id));
                    return [...prev, ...newItems];
                });
                setHasMore(data.length === PAGE_SIZE);
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Error loading more transactions:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [transactions.length, loadingMore, hasMore, getMonthDateRange]);


    // Check if a specific month has transactions
    const hasTransactionsInMonth = useCallback((year: number, month: number) => {
        return availableMonths.has(`${year}-${month}`);
    }, [availableMonths]);

    // Check if a year has any transactions
    const hasTransactionsInYear = useCallback((year: number) => {
        return availableYears.includes(year);
    }, [availableYears]);

    // Get previous year with transactions
    const getPreviousYearWithTransactions = useCallback((currentYear: number) => {
        const sortedYears = availableYears.filter(y => y < currentYear).sort((a, b) => b - a);
        return sortedYears[0] || null;
    }, [availableYears]);

    // Get next year with transactions
    const getNextYearWithTransactions = useCallback((currentYear: number) => {
        const sortedYears = availableYears.filter(y => y > currentYear).sort((a, b) => a - b);
        return sortedYears[0] || null;
    }, [availableYears]);

    // Check if there are any months before current selection with transactions
    const hasPreviousMonthWithTransactions = useCallback(() => {
        const { year, month } = selectedMonth;

        for (const monthKey of availableMonths) {
            const [yearStr, monthStr] = monthKey.split('-');
            const y = parseInt(yearStr);
            const m = parseInt(monthStr);

            // Earlier year = definitely before
            if (y < year) return true;
            // Same year but earlier month
            if (y === year && m < month) return true;
        }

        return false;
    }, [selectedMonth, availableMonths]);

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

            // Check if the new transaction belongs to current selected month
            const transactionDate = new Date(data.date);
            if (
                transactionDate.getFullYear() === selectedMonth.year &&
                transactionDate.getMonth() === selectedMonth.month
            ) {
                setTransactions((prev) => [data, ...prev]);
            }
            
            // Refresh totals
            fetchTotals();
            
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
            
            // Refresh totals in case amount changed
            fetchTotals();
            
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
            
            // Refresh totals
            fetchTotals();
            
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
            setError(errorMessage);
            console.error('Error deleting transaction:', err);
            return { success: false, error: errorMessage };
        }
    };

    // Fetch when month changes
    useEffect(() => {
        fetchTransactions();
    }, [selectedMonth]);

    // Fetch available months on mount
    useEffect(() => {
        fetchAvailableMonths();
    }, []);

    return {
        transactions,
        loading,
        loadingMore,
        hasMore,
        error,
        totals,
        selectedMonth,
        monthLabel,
        isCurrentMonth,
        hasPreviousMonth: hasPreviousMonthWithTransactions(),
        goToPreviousMonth,
        goToNextMonth,
        setMonth,
        hasTransactionsInMonth,
        hasTransactionsInYear,
        getPreviousYearWithTransactions,
        getNextYearWithTransactions,
        availableYears,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refetch: fetchTransactions,
        loadMore,
    };
}
