import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { MonthProvider } from '@/contexts/MonthContext';

// Wrapper to handle StatusBar with theme
function ThemedStatusBar() {
    const { isDark } = useTheme();
    return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <LanguageProvider>
                    <MonthProvider>
                        <ThemedStatusBar />
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                animation: 'slide_from_right',
                                gestureEnabled: true,
                                gestureDirection: 'horizontal',
                            }}
                        >
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        </Stack>
                        <Toast />
                    </MonthProvider>
                </LanguageProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
