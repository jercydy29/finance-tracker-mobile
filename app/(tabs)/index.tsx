import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const currentMonth = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric'
    }).format(new Date());

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Good morning</Text>
                <Text style={styles.month}>{currentMonth}</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>$4,285.18</Text>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.emerald600 }]}>
                            <Ionicons name="arrow-down" size={20} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>Income</Text>
                            <Text style={styles.summaryAmount}>$5,200</Text>
                        </View>
                    </View>

                    <View style={styles.summaryItem}>
                        <View style={[styles.iconCircle, { backgroundColor: colors.red600 }]}>
                            <Ionicons name="arrow-up" size={20} color={colors.white} />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>Expenses</Text>
                            <Text style={styles.summaryAmount}>$914.82</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <Pressable style={styles.scanButton}>
                    <Ionicons name="camera-outline" size={24} color={colors.amber600} />
                    <Text style={styles.scanButtonText}>Scan Receipt</Text>
                </Pressable>

                <Pressable style={styles.addButton}>
                    <Ionicons name="add" size={24} color={colors.white} />
                    <Text style={styles.addButtonText}>Add Manual</Text>
                </Pressable>
            </View>

            {/* Recent Transactions */}
            <View style={styles.transactionsHeader}>
                <Text style={styles.transactionsTitle}>Recent Transactions</Text>
                <Pressable>
                    <Text style={styles.seeAllText}>See all</Text>
                </Pressable>
            </View>

            {/* Transaction List */}
            <View style={styles.transactionsList}>
                <TransactionItem
                    title="Coffee Shop"
                    date="Today"
                    amount="-$5.50"
                    isExpense
                />
                <TransactionItem
                    title="Salary"
                    date="Yesterday"
                    amount="+$3500.00"
                    isExpense={false}
                />
                <TransactionItem
                    title="Groceries"
                    date="Yesterday"
                    amount="-$89.32"
                    isExpense
                />
            </View>
        </ScrollView>
    );
}

function TransactionItem({
    title,
    date,
    amount,
    isExpense
}: {
    title: string;
    date: string;
    amount: string;
    isExpense: boolean;
}) {
    return (
        <View style={styles.transactionItem}>
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
                <Text style={styles.transactionDate}>{date}</Text>
            </View>
            <Text style={[
                styles.transactionAmount,
                { color: isExpense ? colors.red600 : colors.emerald600 }
            ]}>
                {amount}
            </Text>
        </View>
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
    seeAllText: {
        fontSize: 14,
        color: colors.amber600,
        fontWeight: '500',
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
