import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useMonth } from '@/contexts/MonthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type CategoryBreakdown = {
    category: string;
    amount: number;
    percentage: number;
    color: string;
};

type MonthlyTrend = {
    month: string;
    label: string;
    expenses: number;
    income: number;
    isSelected?: boolean;
};

type StatsData = {
    income: number;
    expenses: number;
    balance: number;
    categoryBreakdown: CategoryBreakdown[];
    monthlyTrend: MonthlyTrend[];
};

// Colors for category breakdown chart
const CATEGORY_COLORS: Record<string, string> = {
    Food: '#f59e0b',
    Transport: '#06b6d4',
    Shopping: '#ec4899',
    Entertainment: '#8b5cf6',
    Utilities: '#10b981',
    Health: '#ef4444',
    Education: '#3b82f6',
    Other: '#6b7280',
    // Income categories
    Salary: '#059669',
    Freelance: '#10b981',
    Investments: '#14b8a6',
    Gifts: '#f59e0b',
};

export function useStats() {
    // Use shared month state from context
    const {
        selectedMonth,
        setMonth,
        goToPreviousMonth,
        goToNextMonth,
        isCurrentMonth,
        monthLabel,
    } = useMonth();

    // Get language for locale-aware formatting
    const { language } = useLanguage();
    const locale = language === 'ja' ? 'ja-JP' : 'en-US';

    const [stats, setStats] = useState<StatsData>({
        income: 0,
        expenses: 0,
        balance: 0,
        categoryBreakdown: [],
        monthlyTrend: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                monthsSet.add(`${year}-${month}`);
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
        const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0);
        
        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
        };
    }, [selectedMonth]);

    // Fetch stats for selected month
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { start, end } = getMonthDateRange();

            // Fetch all transactions for the month
            const { data: monthData, error: monthError } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', start)
                .lte('date', end);

            if (monthError) throw monthError;

            // Calculate totals
            let income = 0;
            let expenses = 0;
            const categoryTotals: Record<string, number> = {};

            (monthData || []).forEach((t) => {
                const amount = parseFloat(t.amount);
                if (t.type === 'income') {
                    income += amount;
                } else {
                    expenses += amount;
                    // Track expense categories
                    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
                }
            });

            // Build category breakdown (sorted by amount descending)
            const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryTotals)
                .map(([category, amount]) => ({
                    category,
                    amount,
                    percentage: expenses > 0 ? Math.round((amount / expenses) * 100) : 0,
                    color: CATEGORY_COLORS[category] || '#6b7280',
                }))
                .sort((a, b) => b.amount - a.amount);

            // Fetch 6 months centered around selected month (3 before, selected, 2 after)
            const trendMonths: MonthlyTrend[] = [];
            for (let i = -3; i <= 2; i++) {
                const trendDate = new Date(selectedMonth.year, selectedMonth.month + i, 1);
                const trendStart = trendDate.toISOString().split('T')[0];
                const trendEnd = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0)
                    .toISOString().split('T')[0];

                const { data: trendData } = await supabase
                    .from('transactions')
                    .select('type, amount')
                    .gte('date', trendStart)
                    .lte('date', trendEnd);

                let monthIncome = 0;
                let monthExpenses = 0;

                (trendData || []).forEach((t) => {
                    const amt = parseFloat(t.amount);
                    if (t.type === 'income') {
                        monthIncome += amt;
                    } else {
                        monthExpenses += amt;
                    }
                });

                trendMonths.push({
                    month: `${trendDate.getFullYear()}-${trendDate.getMonth()}`,
                    label: trendDate.toLocaleDateString(locale, { month: 'short' }),
                    expenses: monthExpenses,
                    income: monthIncome,
                    isSelected: i === 0, // Mark the selected month
                });
            }

            setStats({
                income,
                expenses,
                balance: income - expenses,
                categoryBreakdown,
                monthlyTrend: trendMonths,
            });
        // Also refresh available months
            fetchAvailableMonths();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch stats');
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    }, [getMonthDateRange, selectedMonth, fetchAvailableMonths, locale]);

    // Check if a specific month has transactions
    const hasTransactionsInMonth = useCallback((year: number, month: number) => {
        return availableMonths.has(`${year}-${month}`);
    }, [availableMonths]);

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

    // Check if we're at the earliest month with data
    const isEarliestMonth = useCallback(() => {
        if (availableMonths.size === 0) return true;

        // Find earliest month from available data
        let earliest = { year: Infinity, month: 0 };
        availableMonths.forEach((key) => {
            const [year, month] = key.split('-').map(Number);
            if (year < earliest.year || (year === earliest.year && month < earliest.month)) {
                earliest = { year, month };
            }
        });

        return selectedMonth.year === earliest.year && selectedMonth.month === earliest.month;
    }, [selectedMonth, availableMonths]);

    // Fetch when month changes
    useEffect(() => {
        fetchStats();
    }, [selectedMonth]);

    // Fetch available months on mount
    useEffect(() => {
        fetchAvailableMonths();
    }, []);

    return {
        stats,
        loading,
        error,
        selectedMonth,
        monthLabel,
        isCurrentMonth,
        isEarliestMonth: isEarliestMonth(),
        goToPreviousMonth,
        goToNextMonth,
        setMonth,
        hasTransactionsInMonth,
        getPreviousYearWithTransactions,
        getNextYearWithTransactions,
        availableYears,
        refetch: fetchStats,
    };
}
