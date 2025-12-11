import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, SafeAreaView } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeMode } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

type SettingItem = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
};

export default function SettingsScreen() {
    const { colors, themeMode, setThemeMode, isDark } = useTheme();
    const [transactionCount, setTransactionCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const appVersion = Constants.expoConfig?.version || '1.0.0';

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { count } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true });

            setTransactionCount(count || 0);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleThemeChange = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            'Choose Theme',
            'Select your preferred appearance',
            [
                {
                    text: 'Light',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setThemeMode('light');
                    },
                },
                {
                    text: 'Dark',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setThemeMode('dark');
                    },
                },
                {
                    text: 'System',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setThemeMode('system');
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const getThemeLabel = (mode: ThemeMode): string => {
        switch (mode) {
            case 'light': return 'Light';
            case 'dark': return 'Dark';
            case 'system': return 'System';
        }
    };

    const handleExportData = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            'Export Data',
            'This feature will export all your transactions to a CSV file. Coming soon!',
            [{ text: 'OK' }]
        );
    };

    const handleClearData = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Clear All Data',
            'Are you sure you want to delete ALL transactions? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('transactions')
                                .delete()
                                .neq('id', '00000000-0000-0000-0000-000000000000');

                            if (error) throw error;

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Success', 'All transactions have been deleted.');
                            setTransactionCount(0);
                        } catch (error) {
                            console.error('Error clearing data:', error);
                            Alert.alert('Error', 'Failed to clear data. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handlePrivacyPolicy = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert('Privacy Policy', 'Your data is stored securely in Supabase and is only accessible by you.');
    };

    const handleAbout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            'About Finance Tracker',
            `Version ${appVersion}\n\nA simple and beautiful finance tracking app built with React Native and Expo.\n\nTrack your expenses, scan receipts, and stay on top of your finances.`,
            [{ text: 'OK' }]
        );
    };

    const handleRateApp = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            'Rate This App',
            'Thank you for using Finance Tracker! App Store rating coming soon.',
            [{ text: 'OK' }]
        );
    };

    const handleSendFeedback = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL('mailto:feedback@example.com?subject=Finance Tracker Feedback');
    };

    const appearanceSettings: SettingItem[] = [
        {
            icon: isDark ? 'moon' : 'sunny',
            label: 'Appearance',
            value: getThemeLabel(themeMode),
            onPress: handleThemeChange,
        },
    ];

    const dataSettings: SettingItem[] = [
        {
            icon: 'download-outline',
            label: 'Export ',
            value: `${transactionCount} transactions`,
            onPress: handleExportData,
        },
        {
            icon: 'trash-outline',
            label: 'Clear All Data',
            onPress: handleClearData,
            
        },
    ];

    const appSettings: SettingItem[] = [
        {
            icon: 'shield-checkmark-outline',
            label: 'Privacy Policy',
            onPress: handlePrivacyPolicy,
        },
        {
            icon: 'information-circle-outline',
            label: 'About',
            value: `v${appVersion}`,
            onPress: handleAbout,
        },
    ];

    const supportSettings: SettingItem[] = [
        {
            icon: 'star-outline',
            label: 'Rate This App',
            onPress: handleRateApp,
        },
        {
            icon: 'mail-outline',
            label: 'Send Feedback',
            onPress: handleSendFeedback,
        },
    ];

    const styles = createStyles(colors);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <View style={styles.card}>
                        {appearanceSettings.map((item, index) => (
                            <SettingRow
                                key={item.label}
                                item={item}
                                isLast={index === appearanceSettings.length - 1}
                                colors={colors}
                            />
                        ))}
                    </View>
                </View>

                {/* Data Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data</Text>
                    <View style={styles.card}>
                        {dataSettings.map((item, index) => (
                            <SettingRow
                                key={item.label}
                                item={item}
                                isLast={index === dataSettings.length - 1}
                                colors={colors}
                            />
                        ))}
                    </View>
                </View>

                {/* App Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App</Text>
                    <View style={styles.card}>
                        {appSettings.map((item, index) => (
                            <SettingRow
                                key={item.label}
                                item={item}
                                isLast={index === appSettings.length - 1}
                                colors={colors}
                            />
                        ))}
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <View style={styles.card}>
                        {supportSettings.map((item, index) => (
                            <SettingRow
                                key={item.label}
                                item={item}
                                isLast={index === supportSettings.length - 1}
                                colors={colors}
                            />
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Made with love using Expo</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function SettingRow({ item, isLast, colors }: { item: SettingItem; isLast: boolean; colors: any }) {
    return (
        <Pressable
            style={({ pressed }) => [
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: colors.border,
                },
                pressed && { backgroundColor: colors.surfaceSecondary },
            ]}
            onPress={item.onPress}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: item.danger ? colors.lightPink : colors.surfaceSecondary,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.danger ? colors.red600 : colors.amber600}
                    />
                </View>
                <Text style={{
                    fontSize: 16,
                    color: item.danger ? colors.red600 : colors.textPrimary,
                }}>
                    {item.label}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {item.value && (
                    <Text style={{ fontSize: 14, color: colors.textMuted }}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.textPlaceholder} />
            </View>
        </Pressable>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingTop: 16,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
    },
    footer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: colors.textPlaceholder,
    },
});
