import { colors } from '@/constants/colors';
import { useTransactions } from '@/hooks/useTransactions';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const { transactions, loading, totals, refetch } = useTransactions();
    const isFirstFocus = useRef(true);

    // Refetch when screen comes back into focus (not on initial mount)
    useFocusEffect(
        useCallback(() => {
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
                return;
            }
            refetch();
        }, [])
    );

    const currentMonth = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
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

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Good morning</Text>
                <Text style={styles.month}>{currentMonth}</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(totals.balance)}</Text>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.emerald600 }]}>
                            <Ionicons name="arrow-down" size={20} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>Income</Text>
                            <Text style={styles.summaryAmount}>{formatCurrency(totals.income)}</Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.red600 }]}>
                            <Ionicons name="arrow-up" size={20} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>Expenses</Text>
                            <Text style={styles.summaryAmount}>{formatCurrency(totals.expenses)}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
                    <Ionicons name="camera-outline" size={24} color={colors.amber600} />
                    <Text style={styles.scanButtonText}>Scan Receipt</Text>
                </Pressable>

                <Pressable style={styles.addButton} onPress={() => router.push('/add')}>
                    <Ionicons name="add" size={24} color={colors.white} />
                    <Text style={styles.addButtonText}>Add Manual</Text>
                </Pressable>
            </View>

            {/* Recent Transactions */}
            <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Recent Transactions</Text>
            </View>

            {/* Transaction List */}
            {loading && transactions.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.amber600} />
                    <Text style={styles.loadingText}>Loading transactions...</Text>
                </View>
            ) : transactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="wallet-outline" size={64} color={colors.stone400} />
                    <Text style={styles.emptyText}>No transactions yet</Text>
                    <Text style={styles.emptySubtext}>Add your first transaction to get started</Text>
                </View>
            ) : (
                <View style={styles.transactionsList}>
                    {transactions.slice(0, 10).map((transaction) => (
                        <TransactionItem
                            key={transaction.id}
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
                        />
                    ))}
                </View>
            )}
        </ScrollView>
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
}) {
    const formatAmount = (amt: number, isExp: boolean) => {
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
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

    return (
        <Pressable style={styles.transactionItem} onPress={handlePress}>
            <View style={[
                styles.transactionIcon,
                { backgroundColor: isExpense ? colors.lightPink : colors.mintGreen }
            ]}>
                <Ionicons
                    name={isExpense ? 'remove' : 'add'}
                    size={20}
                    color={isExpense ? colors.red600 : colors.emerald600}
                />
            </View>
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
            <Ionicons name="chevron-forward" size={20} color={colors.stone400} style={{ marginLeft: 8 }} />
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
    greeting: {
        fontSize: 16,
        color: colors.stone600,
        marginBottom: 4,
    },
    month: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.stone800,
    },
    balanceCard: {
        backgroundColor: colors.gray700,
        marginHorizontal: 24,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
    },
    balanceLabel: {
        fontSize: 14,
        color: colors.stone200,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: colors.white,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 16,
    },
    summaryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.stone200,
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 24,
    },
    scanButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: colors.amber600,
    },
    scanButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.amber600,
    },
    addButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.amber600,
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
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
        color: colors.stone800,
    },
    loadingContainer: {
        paddingVertical: 48,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.stone600,
    },
    emptyContainer: {
        paddingVertical: 48,
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.stone800,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.stone500,
    },
    transactionsList: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    transactionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.stone800,
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 14,
        color: colors.stone500,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
});
