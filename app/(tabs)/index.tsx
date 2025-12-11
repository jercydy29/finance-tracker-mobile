import { MonthPicker } from '@/components/MonthPicker';
import { useTheme } from '@/contexts/ThemeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

export default function HomeScreen() {
    const { colors } = useTheme();
    const {
        transactions,
        loading,
        loadingMore,
        hasMore,
        totals,
        refetch,
        deleteTransaction,
        loadMore,
        monthLabel,
        isCurrentMonth,
        hasPreviousMonth,
        goToPreviousMonth,
        goToNextMonth,
        selectedMonth,
        setMonth,
        hasTransactionsInMonth,
        getPreviousYearWithTransactions,
        getNextYearWithTransactions,
        availableYears,
    } = useTransactions();
    const isFirstFocus = useRef(true);
    const flatListRef = useRef<FlatList>(null);
    const [monthPickerVisible, setMonthPickerVisible] = useState(false);
    const styles = createStyles(colors);

    // Refetch and scroll to top when screen comes back into focus (not on initial mount)
    useFocusEffect(
        useCallback(() => {
            // Always scroll to top when tab is focused
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

            if (isFirstFocus.current) {
                isFirstFocus.current = false;
                return;
            }
            refetch();
        }, [refetch])
    );

    // Handle delete with confirmation
    const handleDelete = useCallback((id: string, title: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Delete Transaction',
            `Are you sure you want to delete "${title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await deleteTransaction(id);
                        if (result.success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                    },
                },
            ]
        );
    }, [deleteTransaction]);

    // Handle month navigation with haptic feedback
    const handlePreviousMonth = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToPreviousMonth();
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [goToPreviousMonth]);

    const handleNextMonth = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToNextMonth();
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [goToNextMonth]);

    const handleMonthSelect = useCallback((year: number, month: number) => {
        setMonth(year, month);
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [setMonth]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Header component for FlatList
    const ListHeader = () => (
        <>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Your Finances</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Monthly Balance</Text>
                <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
                    {formatCurrency(totals.balance)}
                </Text>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryItemWrapper}>
                        <View style={[styles.indicator, { backgroundColor: colors.emerald600 }]} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Income</Text>
                            <Text style={styles.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrency(totals.income)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryItemWrapper}>
                        <View style={[styles.indicator, { backgroundColor: colors.red600 }]} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Expenses</Text>
                            <Text style={styles.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>
                                {formatCurrency(totals.expenses)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Transactions Header with Month Navigation */}
            <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Transactions</Text>
                <View style={styles.monthNav}>
                    <Pressable
                        onPress={handlePreviousMonth}
                        style={({ pressed }) => [
                            styles.monthNavButton,
                            !hasPreviousMonth && styles.monthNavButtonDisabled,
                            pressed && hasPreviousMonth && { transform: [{ scale: 0.9 }] },
                        ]}
                        disabled={!hasPreviousMonth}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={20}
                            color={hasPreviousMonth ? colors.textPrimary : colors.textPlaceholder}
                        />
                    </Pressable>
                    <Pressable
                        onPress={() => setMonthPickerVisible(true)}
                        style={({ pressed }) => [
                            styles.monthButton,
                            pressed && { transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <Text style={styles.monthText}>{monthLabel}</Text>
                        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                        onPress={handleNextMonth}
                        style={({ pressed }) => [
                            styles.monthNavButton,
                            isCurrentMonth && styles.monthNavButtonDisabled,
                            pressed && !isCurrentMonth && { transform: [{ scale: 0.9 }] },
                        ]}
                        disabled={isCurrentMonth}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={isCurrentMonth ? colors.textPlaceholder : colors.textPrimary}
                        />
                    </Pressable>
                </View>
            </View>
        </>
    );

    // Footer component (loading more indicator)
    const ListFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.amber400} />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
        );
    };

    // Empty state component
    const ListEmpty = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.amber400} />
                    <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color={colors.stone400} />
                <Text style={styles.emptyText}>No transactions this month</Text>
                <Text style={styles.emptySubtext}>Add a transaction or browse other months</Text>
            </View>
        );
    };

    // Render each transaction item
    const renderTransaction = ({ item: transaction }: { item: typeof transactions[0] }) => (
        <TransactionItem
            id={transaction.id}
            title={transaction.description || transaction.category}
            category={transaction.category}
            date={formatDate(transaction.date)}
            amount={parseFloat(transaction.amount)}
            isExpense={transaction.type === 'expense'}
            type={transaction.type}
            description={transaction.description}
            rawDate={transaction.date}
            receiptUrl={transaction.receipt_url}
            onDelete={handleDelete}
            colors={colors}
            styles={styles}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={ListHeader}
                ListFooterComponent={ListFooter}
                ListEmptyComponent={ListEmpty}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && transactions.length > 0}
                        onRefresh={refetch}
                        tintColor={colors.amber400}
                        colors={[colors.amber400]}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.3}
            />

            <MonthPicker
                visible={monthPickerVisible}
                onClose={() => setMonthPickerVisible(false)}
                selectedYear={selectedMonth.year}
                selectedMonth={selectedMonth.month}
                onSelectMonth={handleMonthSelect}
                hasTransactionsInMonth={hasTransactionsInMonth}
                getPreviousYearWithTransactions={getPreviousYearWithTransactions}
                getNextYearWithTransactions={getNextYearWithTransactions}
                availableYears={availableYears}
            />
        </SafeAreaView>
    );
}

function TransactionItem({
    id,
    title,
    category,
    date,
    amount,
    isExpense,
    type,
    description,
    rawDate,
    receiptUrl,
    onDelete,
    colors,
    styles,
}: {
    id: string;
    title: string;
    category: string;
    date: string;
    amount: number;
    isExpense: boolean;
    type: 'expense' | 'income';
    description: string;
    rawDate: string;
    receiptUrl?: string | null;
    onDelete: (id: string, title: string) => void;
    colors: any;
    styles: any;
}) {
    const swipeableRef = useRef<Swipeable>(null);

    const formatAmount = (amt: number, isExp: boolean) => {
        const formatted = new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
        }).format(amt);
        return isExp ? `-${formatted}` : `+${formatted}`;
    };

    const handlePress = () => {
        router.push({
            pathname: '/edit',
            params: {
                id,
                type,
                amount: amount.toString(),
                category,
                description,
                date: rawDate,
                receipt_url: receiptUrl || '',
            },
        });
    };

    const handleDeletePress = () => {
        swipeableRef.current?.close();
        onDelete(id, title);
    };

    const renderRightActions = () => {
        return (
            <Pressable
                style={styles.deleteAction}
                onPress={handleDeletePress}
            >
                <Ionicons name="trash-outline" size={24} color={colors.white} />
                <Text style={styles.deleteActionText}>Delete</Text>
            </Pressable>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            overshootRight={false}
            friction={2}
        >
            <Pressable style={styles.transactionItem} onPress={handlePress}>
                <View style={[
                    styles.transactionIndicator,
                    { backgroundColor: isExpense ? colors.red600 : colors.emerald600 }
                ]} />
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{title}</Text>
                    <Text style={styles.transactionDate}>{category} • {date}</Text>
                </View>
                <Text style={[
                    styles.transactionAmount,
                    { color: isExpense ? colors.red600 : colors.emerald600 }
                ]}>
                    {formatAmount(amount, isExpense)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ alignSelf: 'center' }} />
            </Pressable>
        </Swipeable>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        flexGrow: 1,
        paddingBottom: 24,
    },
    header: {
        paddingTop: 16,
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthNavButton: {
        padding: 6,
        borderRadius: 6,
    },
    monthNavButtonDisabled: {
        opacity: 0.5,
    },
    monthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: colors.surfaceSecondary,
    },
    monthText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    balanceCard: {
        backgroundColor: colors.surface,
        marginHorizontal: 24,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        // borderWidth: 1,
        // borderColor: colors.border,
    },
    balanceLabel: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
    },
    summaryItemWrapper: {
        flex: 1,
    },
    summaryItem: {
        backgroundColor: colors.surfaceSecondary,
        padding: 16,
        borderRadius: 12,
    },
    indicator: {
        width: '85%',
        height: 4,
        borderRadius: 2,
        marginBottom: 6,
        alignSelf: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    transactionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    transactionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    loadingMoreContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loadingMoreText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    loadingContainer: {
        paddingVertical: 48,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textTertiary,
    },
    emptyContainer: {
        paddingVertical: 48,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textMuted,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: colors.surface,
        marginHorizontal: 24,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    transactionIndicator: {
        width: 4,
        borderRadius: 2,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 14,
        color: colors.textMuted,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
        alignSelf: 'center',
    },
    deleteAction: {
        backgroundColor: colors.red600,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        marginBottom: 12,
        marginRight: 24,
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
    },
    deleteActionText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
});
