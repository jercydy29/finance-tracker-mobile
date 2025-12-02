import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { colors } from '@/constants/colors';
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
                                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
                            
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
        // You can replace this with your actual privacy policy URL
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

    const dataSettings: SettingItem[] = [
        {
            icon: 'download-outline',
            label: 'Export Transactions',
            value: `${transactionCount} transactions`,
            onPress: handleExportData,
        },
        {
            icon: 'trash-outline',
            label: 'Clear All Data',
            onPress: handleClearData,
            danger: true,
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

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
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
                        />
                    ))}
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>Made with ❤️ using Expo</Text>
            </View>
        </ScrollView>
    );
}

function SettingRow({ item, isLast }: { item: SettingItem; isLast: boolean }) {
    return (
        <Pressable
            style={[styles.settingRow, !isLast && styles.settingRowBorder]}
            onPress={item.onPress}
        >
            <View style={styles.settingLeft}>
                <View style={[
                    styles.iconContainer,
                    item.danger && styles.iconContainerDanger
                ]}>
                    <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.danger ? colors.red600 : colors.amber600}
                    />
                </View>
                <Text style={[
                    styles.settingLabel,
                    item.danger && styles.settingLabelDanger
                ]}>
                    {item.label}
                </Text>
            </View>
            <View style={styles.settingRight}>
                {item.value && (
                    <Text style={styles.settingValue}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.stone400} />
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.stone50,
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.stone800,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.stone500,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: 16,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    settingRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.stone100,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.stone50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerDanger: {
        backgroundColor: colors.lightPink,
    },
    settingLabel: {
        fontSize: 16,
        color: colors.stone800,
    },
    settingLabelDanger: {
        color: colors.red600,
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 14,
        color: colors.stone500,
    },
    footer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: colors.stone400,
    },
});
