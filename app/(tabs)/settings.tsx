import { ThemeMode } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

type SettingItem = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
};

export default function SettingsScreen() {
    const { colors, themeMode, setThemeMode, isDark } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const [transactionCount, setTransactionCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [showExportPicker, setShowExportPicker] = useState(false);
    const [exportType, setExportType] = useState<'month' | 'year' | null>(null);
    const [exportYear, setExportYear] = useState(new Date().getFullYear());
    const [exportMonth, setExportMonth] = useState(new Date().getMonth());
    const [availableYears, setAvailableYears] = useState<Set<number>>(new Set());
    const [availableMonths, setAvailableMonths] = useState<Map<number, Set<number>>>(new Map());

    const appVersion = Constants.expoConfig?.version || '1.0.0';

    // Fetch available years and months with transaction data
    const fetchAvailableDates = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('date');

            if (error || !data) return;

            const years = new Set<number>();
            const monthsByYear = new Map<number, Set<number>>();

            for (const { date } of data) {
                const d = new Date(date);
                const year = d.getFullYear();
                const month = d.getMonth();

                years.add(year);

                if (!monthsByYear.has(year)) {
                    monthsByYear.set(year, new Set());
                }
                monthsByYear.get(year)!.add(month);
            }

            setAvailableYears(years);
            setAvailableMonths(monthsByYear);
        } catch (error) {
            console.error('Error fetching available dates:', error);
        }
    };

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
            t('settings.selectTheme'),
            '',
            [
                {
                    text: t('settings.themeLight'),
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setThemeMode('light');
                    },
                },
                {
                    text: t('settings.themeDark'),
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setThemeMode('dark');
                    },
                },
                {
                    text: t('settings.themeSystem'),
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setThemeMode('system');
                    },
                },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    };

    const getThemeLabel = (mode: ThemeMode): string => {
        switch (mode) {
            case 'light': return t('settings.themeLight');
            case 'dark': return t('settings.themeDark');
            case 'system': return t('settings.themeSystem');
        }
    };

    const handleLanguageChange = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(
            t('settings.selectLanguage'),
            '',
            [
                {
                    text: 'English',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setLanguage('en');
                    },
                },
                {
                    text: '日本語',
                    onPress: () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setLanguage('ja');
                    },
                },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    };

    const getLanguageLabel = (): string => {
        return language === 'ja' ? '日本語' : 'English';
    };

    const handleExportData = () => {
        if (exporting) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        Alert.alert(
            t('settings.exportData'),
            t('settings.selectDateRange'),
            [
                {
                    text: 'By Month',
                    onPress: async () => {
                        await fetchAvailableDates();
                        setExportType('month');
                        setShowExportPicker(true);
                    },
                },
                {
                    text: 'By Year',
                    onPress: async () => {
                        await fetchAvailableDates();
                        setExportType('year');
                        setShowExportPicker(true);
                    },
                },
                {
                    text: t('settings.allTime'),
                    onPress: () => performExport('lifetime'),
                },
                { text: t('common.cancel'), style: 'cancel' },
            ]
        );
    };

    // Helper functions for checking data availability
    const hasDataForYear = (year: number) => availableYears.has(year);
    const hasDataForMonth = (year: number, month: number) => availableMonths.get(year)?.has(month) ?? false;
    const hasPrevYear = () => {
        const minYear = Math.min(...Array.from(availableYears));
        return exportYear > minYear;
    };
    const hasNextYear = () => {
        const maxYear = Math.max(...Array.from(availableYears));
        return exportYear < maxYear;
    };

    const performExport = async (type: 'month' | 'year' | 'lifetime', year?: number, month?: number) => {
        setShowExportPicker(false);

        // Wait for modal to fully dismiss before proceeding (prevents iOS share sheet conflict)
        await new Promise(resolve => setTimeout(resolve, 300));

        setExporting(true);

        try {
            let filename: string;
            let query = supabase
                .from('transactions')
                .select('date, type, category, amount, description')
                .order('date', { ascending: false });

            console.log('Starting export:', { type, year, month });

            if (type === 'month' && year !== undefined && month !== undefined) {
                const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                const endDate = new Date(year, month + 1, 0); // Last day of month
                const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

                console.log('Month export dates:', { startDate, endDateStr });

                query = query.gte('date', startDate).lte('date', endDateStr);
                filename = `transactions_${year}-${String(month + 1).padStart(2, '0')}.csv`;
            } else if (type === 'year' && year !== undefined) {
                console.log('Year export dates:', { year });
                query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
                filename = `transactions_${year}.csv`;
            } else {
                console.log('Lifetime export');
                filename = `transactions_lifetime.csv`;
            }

            console.log('Executing query...');
            const { data: transactions, error } = await query;
            console.log('Query finished, rows:', transactions?.length, 'error:', error);

            if (error) throw error;

            if (!transactions || transactions.length === 0) {
                Alert.alert(t('stats.noData'), 'There are no transactions for the selected period.');
                return;
            }

            // Create CSV content
            const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
            const csvRows = [headers.join(',')];

            for (const t of transactions) {
                const row = [
                    t.date,
                    t.type,
                    t.category,
                    t.amount,
                    `"${(t.description || '').replace(/"/g, '""')}"` // Escape quotes in description
                ];
                csvRows.push(row.join(','));
            }

            const csvContent = csvRows.join('\n');

            // Write to file and share
            const fileUri = FileSystem.documentDirectory + filename;
            await FileSystem.writeAsStringAsync(fileUri, csvContent);

            if (!(await Sharing.isAvailableAsync())) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(t('common.error'), 'Sharing is not available on this device');
                return;
            }

            // Share the file
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: 'Export Transactions',
                UTI: 'public.comma-separated-values-text'
            });

            // Success feedback happens naturally via the share sheet, 
            // but we can give a small haptic feedback when the sheet opens
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.error('Export error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(t('settings.exportError'), 'Could not export transactions. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleClearData = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            t('settings.clearData'),
            t('settings.clearDataMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('transactions')
                                .delete()
                                .neq('id', '00000000-0000-0000-0000-000000000000');

                            if (error) throw error;

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert(t('common.success'), t('settings.clearSuccess'));
                            setTransactionCount(0);
                        } catch (error) {
                            console.error('Error clearing data:', error);
                            Alert.alert(t('common.error'), 'Failed to clear data. Please try again.');
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
            t('settings.about'),
            `${t('settings.version')} ${appVersion}\n\nA simple and beautiful finance tracking app built with React Native and Expo.\n\nTrack your expenses, scan receipts, and stay on top of your finances.`,
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
            label: t('settings.theme'),
            value: getThemeLabel(themeMode),
            onPress: handleThemeChange,
        },
        {
            icon: 'language',
            label: t('settings.language'),
            value: getLanguageLabel(),
            onPress: handleLanguageChange,
        },
    ];

    const dataSettings: SettingItem[] = [
        {
            icon: 'download-outline',
            label: t('settings.exportData'),
            value: exporting ? 'Exporting...' : `${transactionCount} transactions`,
            onPress: handleExportData,
        },
        {
            icon: 'trash-outline',
            label: t('settings.clearData'),
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
            label: t('settings.about'),
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
            label: t('settings.feedback'),
            onPress: handleSendFeedback,
        },
    ];

    const styles = createStyles(colors);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{t('settings.title')}</Text>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
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
                    <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
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
                    <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
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

            {/* Export Date Picker Modal */}
            <Modal
                visible={showExportPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExportPicker(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowExportPicker(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>
                            {exportType === 'month' ? t('monthPicker.title') : 'Select Year'}
                        </Text>

                        {/* Year Navigation */}
                        <View style={styles.yearNav}>
                            <Pressable
                                onPress={() => {
                                    if (!hasPrevYear()) return;
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setExportYear(exportYear - 1);
                                }}
                                style={[styles.yearNavButton, !hasPrevYear() && styles.yearNavButtonDisabled]}
                                disabled={!hasPrevYear()}
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={24}
                                    color={hasPrevYear() ? colors.textPrimary : colors.textPlaceholder}
                                />
                            </Pressable>
                            <Text style={[
                                styles.yearText,
                                !hasDataForYear(exportYear) && styles.yearTextDisabled
                            ]}>
                                {exportYear}
                            </Text>
                            <Pressable
                                onPress={() => {
                                    if (!hasNextYear()) return;
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setExportYear(exportYear + 1);
                                }}
                                style={[styles.yearNavButton, !hasNextYear() && styles.yearNavButtonDisabled]}
                                disabled={!hasNextYear()}
                            >
                                <Ionicons
                                    name="chevron-forward"
                                    size={24}
                                    color={hasNextYear() ? colors.textPrimary : colors.textPlaceholder}
                                />
                            </Pressable>
                        </View>

                        {/* Month Grid (only for month export) */}
                        {exportType === 'month' && (
                            <View style={styles.monthGrid}>
                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => {
                                    const hasData = hasDataForMonth(exportYear, index);
                                    const isSelected = exportMonth === index;
                                    return (
                                        <Pressable
                                            key={month}
                                            style={[
                                                styles.monthButton,
                                                isSelected && hasData && styles.monthButtonSelected,
                                                !hasData && styles.monthButtonDisabled,
                                            ]}
                                            onPress={() => {
                                                if (!hasData) return;
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                setExportMonth(index);
                                            }}
                                            disabled={!hasData}
                                        >
                                            <Text style={[
                                                styles.monthText,
                                                isSelected && hasData && styles.monthTextSelected,
                                                !hasData && styles.monthTextDisabled,
                                            ]}>
                                                {month}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <Pressable
                                style={styles.cancelButton}
                                onPress={() => setShowExportPicker(false)}
                            >
                                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                            </Pressable>
                            {(() => {
                                const canExport = exportType === 'month'
                                    ? hasDataForMonth(exportYear, exportMonth)
                                    : hasDataForYear(exportYear);
                                return (
                                    <Pressable
                                        style={[styles.exportButton, !canExport && styles.exportButtonDisabled]}
                                        onPress={() => {
                                            if (!canExport) return;
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                            if (exportType === 'month') {
                                                performExport('month', exportYear, exportMonth);
                                            } else {
                                                performExport('year', exportYear);
                                            }
                                        }}
                                        disabled={!canExport}
                                    >
                                        <Text style={[styles.exportButtonText, !canExport && styles.exportButtonTextDisabled]}>
                                            Export
                                        </Text>
                                    </Pressable>
                                );
                            })()}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 20,
    },
    yearNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 20,
    },
    yearNavButton: {
        padding: 8,
    },
    yearNavButtonDisabled: {
        opacity: 0.3,
    },
    yearText: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.textPrimary,
        minWidth: 80,
        textAlign: 'center',
    },
    yearTextDisabled: {
        color: colors.textPlaceholder,
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 20,
    },
    monthButton: {
        width: '30%',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
    },
    monthButtonSelected: {
        backgroundColor: colors.amber600,
    },
    monthButtonDisabled: {
        backgroundColor: colors.surfaceSecondary,
        opacity: 0.4,
    },
    monthText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textPrimary,
    },
    monthTextSelected: {
        color: '#FFFFFF',
    },
    monthTextDisabled: {
        color: colors.textPlaceholder,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    exportButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.amber600,
        alignItems: 'center',
    },
    exportButtonDisabled: {
        backgroundColor: colors.surfaceSecondary,
    },
    exportButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    exportButtonTextDisabled: {
        color: colors.textPlaceholder,
    },
});
