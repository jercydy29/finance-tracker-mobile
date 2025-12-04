import { useColorScheme } from 'react-native';

// Light theme colors (current colors)
export const lightColors = {
    // Primary
    amber400: '#fbbf24',
    amber600: '#d97706',

    // Success (income)
    emerald600: '#059669',
    emerald700: '#047857',

    // Danger (expenses)
    red600: '#dc2626',

    // Backgrounds
    background: '#fafaf9',      // stone50
    surface: '#ffffff',         // white
    surfaceSecondary: '#f5f5f4', // stone100
    border: '#e7e5e4',          // stone200

    // Text
    textPrimary: '#1c1917',     // stone800
    textSecondary: '#44403c',   // stone700
    textTertiary: '#57534e',    // stone600
    textMuted: '#78716c',       // stone500
    textPlaceholder: '#a8a29e', // stone400

    // Tab bar
    tabBar: '#ffffff',
    tabBarBorder: '#e7e5e4',
    tabActive: '#d97706',
    tabInactive: '#78716c',

    // Cards
    mintGreen: '#a7f3d0',
    lightPink: '#fecaca',

    // Constants
    white: '#ffffff',
    black: '#000000',
};

// Dark theme colors
export const darkColors = {
    // Primary (slightly brighter for dark mode)
    amber400: '#fbbf24',
    amber600: '#f59e0b',

    // Success (income)
    emerald600: '#10b981',
    emerald700: '#059669',

    // Danger (expenses)
    red600: '#ef4444',

    // Backgrounds
    background: '#0c0a09',      // stone950
    surface: '#1c1917',         // stone800
    surfaceSecondary: '#292524', // stone900
    border: '#44403c',          // stone700

    // Text
    textPrimary: '#fafaf9',     // stone50
    textSecondary: '#e7e5e4',   // stone200
    textTertiary: '#d6d3d1',    // stone300
    textMuted: '#a8a29e',       // stone400
    textPlaceholder: '#78716c', // stone500

    // Tab bar
    tabBar: '#1c1917',
    tabBarBorder: '#44403c',
    tabActive: '#f59e0b',
    tabInactive: '#78716c',

    // Cards (darker versions)
    mintGreen: '#065f46',       // emerald-800
    lightPink: '#991b1b',       // red-800

    // Constants
    white: '#ffffff',
    black: '#000000',
};

export type ThemeColors = typeof lightColors;

export type ThemeMode = 'light' | 'dark' | 'system';

export function getColors(isDark: boolean): ThemeColors {
    return isDark ? darkColors : lightColors;
}
