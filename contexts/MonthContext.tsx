import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type SelectedMonth = {
    year: number;
    month: number;
};

type MonthContextType = {
    selectedMonth: SelectedMonth;
    setMonth: (year: number, month: number) => void;
    goToPreviousMonth: () => void;
    goToNextMonth: () => void;
    isCurrentMonth: boolean;
    monthLabel: string;
};

const MonthContext = createContext<MonthContextType | undefined>(undefined);

export function MonthProvider({ children }: { children: ReactNode }) {
    // Selected month state (defaults to current month)
    const [selectedMonth, setSelectedMonth] = useState<SelectedMonth>(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    // Set month directly (for month picker)
    const setMonth = useCallback((year: number, month: number) => {
        setSelectedMonth({ year, month });
    }, []);

    // Navigate to previous month
    const goToPreviousMonth = useCallback(() => {
        setSelectedMonth((prev) => {
            if (prev.month === 0) {
                return { year: prev.year - 1, month: 11 };
            }
            return { year: prev.year, month: prev.month - 1 };
        });
    }, []);

    // Navigate to next month
    const goToNextMonth = useCallback(() => {
        setSelectedMonth((prev) => {
            if (prev.month === 11) {
                return { year: prev.year + 1, month: 0 };
            }
            return { year: prev.year, month: prev.month + 1 };
        });
    }, []);

    // Check if we're on current month
    const now = new Date();
    const isCurrentMonth = selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth();

    // Get formatted month label
    const date = new Date(selectedMonth.year, selectedMonth.month);
    const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);

    return (
        <MonthContext.Provider value={{
            selectedMonth,
            setMonth,
            goToPreviousMonth,
            goToNextMonth,
            isCurrentMonth,
            monthLabel,
        }}>
            {children}
        </MonthContext.Provider>
    );
}

export function useMonth() {
    const context = useContext(MonthContext);
    if (context === undefined) {
        throw new Error('useMonth must be used within a MonthProvider');
    }
    return context;
}
