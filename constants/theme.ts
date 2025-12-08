import { useColorScheme } from 'react-native';

// New Palette
const palette = {
    crail: '#C15F3C',      // Primary
    crailLight: '#E08D6C', // Lighter primary
    cloudy: '#B1ADA1',     // Muted gray-beige
    cloudyLight: '#E0DED7', // Light version for secondary surfaces
    pampas: '#F4F3EE',     // Soft off-white/cream (Background)
    white: '#FFFFFF',
    
    // Dark Mode
    charcoal: '#1C1C1E',   // Background
    charcoalSurface: '#2C2C2E', // Surface
    charcoalLight: '#48484A',   // Secondary Surface (Brightened from #3A3A3C)
    charcoalBorder: '#636366',  // Border (New, lighter for visibility)
};

// Light theme colors (current colors)
export const lightColors = {
    // Primary
    amber400: palette.crailLight,
    amber600: palette.crail,

    // Success (income)
    emerald600: '#059669',
    emerald700: '#047857',

    // Danger (expenses)
    red600: '#dc2626',

    // Backgrounds
    background: palette.pampas,
    surface: palette.white,
    surfaceSecondary: palette.cloudyLight,
    border: palette.cloudy,

    // Text
    textPrimary: '#1c1917',     // stone800
    textSecondary: '#44403c',   // stone700
    textTertiary: '#57534e',    // stone600
    textMuted: '#78716c',       // stone500
    textPlaceholder: palette.cloudy, // stone400 -> Cloudy

    // Tab bar
    tabBar: palette.white,
    tabBarBorder: palette.cloudy,
    tabActive: palette.crail,
    tabInactive: '#78716c',

    // Cards
    mintGreen: '#a7f3d0',
    lightPink: '#fecaca',

    // Constants
    white: palette.white,
    black: '#000000',
};

// Dark theme colors
export const darkColors = {
    // Primary (slightly brighter for dark mode)
    amber400: palette.crailLight,
    amber600: palette.crail,

    // Success (income)
    emerald600: '#10b981',
    emerald700: '#059669',

    // Danger (expenses)
    red600: '#ef4444',

    // Backgrounds
    background: palette.charcoal,
    surface: palette.charcoalSurface,
    surfaceSecondary: palette.charcoalLight,
    border: palette.charcoalBorder,

    // Text
    textPrimary: palette.pampas,
    textSecondary: '#e7e5e4',   // stone200
    textTertiary: '#d6d3d1',    // stone300
    textMuted: '#a8a29e',       // stone400
    textPlaceholder: '#78716c', // stone500

    // Tab bar
    tabBar: palette.charcoalSurface,
    tabBarBorder: palette.charcoalLight,
    tabActive: palette.crail,
    tabInactive: palette.cloudy,

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
