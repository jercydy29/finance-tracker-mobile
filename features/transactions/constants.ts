export const EXPENSE_CATEGORIES = [
    'Food',
    'Transport',
    'Entertainment',
    'Utilities',
    'Health',
    'Shopping',
    'Education',
    'Other',
] as const;

export const INCOME_CATEGORIES = [
    'Salary',
    'Freelance',
    'Investments',
    'Gifts',
    'Other',
] as const;

// Translation key mapping for categories
export const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
    // Expense categories
    'Food': 'categories.expense.food',
    'Transport': 'categories.expense.transport',
    'Entertainment': 'categories.expense.entertainment',
    'Utilities': 'categories.expense.utilities',
    'Health': 'categories.expense.health',
    'Shopping': 'categories.expense.shopping',
    'Education': 'categories.expense.education',
    // Income categories
    'Salary': 'categories.income.salary',
    'Freelance': 'categories.income.freelance',
    'Investments': 'categories.income.investments',
    'Gifts': 'categories.income.gifts',
    // Other (shared)
    'Other': 'categories.expense.other', // Default to expense.other
};

// Helper function to get translation key for a category
export function getCategoryTranslationKey(category: string, type: 'expense' | 'income'): string {
    // Special case for "Other" - use type to determine the correct translation key
    if (category === 'Other') {
        return type === 'expense' ? 'categories.expense.other' : 'categories.income.other';
    }

    return CATEGORY_TRANSLATION_KEYS[category] || 'categories.expense.other';
}
