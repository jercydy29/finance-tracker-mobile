import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { colors } from '@/constants/colors';
import { useStats } from '@/hooks/useStats';
import { MonthPicker } from '@/components/MonthPicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';

// Try to import react-native-svg, fallback to simple view if not available
let Svg: any, Path: any, Circle: any;
try {
    const svg = require('react-native-svg');
    Svg = svg.default || svg.Svg;
    Path = svg.Path;
    Circle = svg.Circle;
} catch (e) {
    // SVG not available, will use fallback
    Svg = null;
}

export default function StatsScreen() {
    const {
        stats,
        loading,
        monthLabel,
        isCurrentMonth,
        goToPreviousMonth,
        goToNextMonth,
        selectedMonth,
        setMonth,
        hasTransactionsInMonth,
        getPreviousYearWithTransactions,
        getNextYearWithTransactions,
        availableYears,
        refetch,
    } = useStats();

    const [monthPickerVisible, setMonthPickerVisible] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const handlePreviousMonth = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToPreviousMonth();
    };

    const handleNextMonth = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToNextMonth();
    };

    const handleMonthSelect = useCallback((year: number, month: number) => {
        setMonth(year, month);
    }, [setMonth]);

    // Find max expense for bar chart scaling
    const maxExpense = Math.max(...stats.monthlyTrend.map(m => m.expenses), 1);

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={refetch} />
            }
        >
            {/* Header with Month Navigation */}
            <View style={styles.header}>
                <Text style={styles.title}>Statistics</Text>
                <View style={styles.monthNav}>
                    <Pressable
                        onPress={handlePreviousMonth}
                        style={({ pressed }) => [
                            styles.monthNavButton,
                            pressed && { transform: [{ scale: 0.9 }] },
                        ]}
                    >
                        <Ionicons name="chevron-back" size={20} color={colors.stone800} />
                    </Pressable>
                    <Pressable
                        onPress={() => setMonthPickerVisible(true)}
                        style={({ pressed }) => [
                            styles.monthButton,
                            pressed && { transform: [{ scale: 0.95 }] },
                        ]}
                    >
                        <Text style={styles.monthText}>{monthLabel}</Text>
                        <Ionicons name="chevron-down" size={16} color={colors.stone500} />
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
                            color={isCurrentMonth ? colors.stone300 : colors.stone800}
                        />
                    </Pressable>
                </View>
            </View>

            {loading && stats.income === 0 && stats.expenses === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.amber600} />
                    <Text style={styles.loadingText}>Loading statistics...</Text>
                </View>
            ) : (
                <>
                    {/* Income/Expenses Cards */}
                    <View style={styles.summaryCards}>
                        <View style={[styles.card, { backgroundColor: colors.mintGreen }]}>
                            <Text style={styles.cardLabel}>Income</Text>
                            <Text style={[styles.cardAmount, { color: colors.emerald700 }]}>
                                {formatCurrency(stats.income)}
                            </Text>
                        </View>
                        <View style={[styles.card, { backgroundColor: colors.lightPink }]}>
                            <Text style={styles.cardLabel}>Expenses</Text>
                            <Text style={[styles.cardAmount, { color: colors.red600 }]}>
                                {formatCurrency(stats.expenses)}
                            </Text>
                        </View>
                    </View>

                    {/* Balance Card */}
                    <View style={styles.section}>
                        <View style={styles.balanceCard}>
                            <Text style={styles.balanceLabel}>Net Balance</Text>
                            <Text style={[
                                styles.balanceAmount,
                                { color: stats.balance >= 0 ? colors.emerald600 : colors.red600 }
                            ]}>
                                {stats.balance >= 0 ? '+' : ''}{formatCurrency(stats.balance)}
                            </Text>
                        </View>
                    </View>

                    {/* Expense Breakdown */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
                        <View style={styles.breakdownCard}>
                            {stats.categoryBreakdown.length > 0 ? (
                                <>
                                    {/* Segmented Pie Chart */}
                                    <View style={styles.chartContainer}>
                                        <PieChart 
                                            data={stats.categoryBreakdown} 
                                            total={stats.expenses}
                                        />
                                        <View style={styles.chartCenter}>
                                            <Text style={styles.chartTotal}>
                                                {formatCurrency(stats.expenses)}
                                            </Text>
                                            <Text style={styles.chartLabel}>Total</Text>
                                        </View>
                                    </View>

                                    {/* Legend with real data */}
                                    <View style={styles.legend}>
                                        {stats.categoryBreakdown.map((item) => (
                                            <LegendItem
                                                key={item.category}
                                                color={item.color}
                                                label={item.category}
                                                amount={formatCurrency(item.amount)}
                                                percentage={`${item.percentage}%`}
                                            />
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="pie-chart-outline" size={48} color={colors.stone300} />
                                    <Text style={styles.emptyText}>No expenses this month</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Monthly Trend */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Monthly Trend (Expenses)</Text>
                        <View style={styles.trendCard}>
                            {stats.monthlyTrend.length > 0 ? (
                                <View style={styles.barChart}>
                                    {stats.monthlyTrend.map((month, index) => {
                                        const isActive = index === stats.monthlyTrend.length - 1;
                                        const heightPercent = maxExpense > 0 
                                            ? Math.max((month.expenses / maxExpense) * 100, 5) 
                                            : 5;
                                        
                                        return (
                                            <BarItem
                                                key={month.month}
                                                height={heightPercent}
                                                label={month.label}
                                                amount={formatCurrency(month.expenses)}
                                                isActive={isActive}
                                            />
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="bar-chart-outline" size={48} color={colors.stone300} />
                                    <Text style={styles.emptyText}>No data available</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </>
            )}

            {/* Month Picker Modal */}
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
        </ScrollView>
    );
}

// Segmented Pie Chart Component
function PieChart({ 
    data, 
    total 
}: { 
    data: { category: string; amount: number; percentage: number; color: string }[];
    total: number;
}) {
    const size = 160;
    const strokeWidth = 28;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;

    // If SVG is not available, show a simple fallback
    if (!Svg) {
        const holeSize = size * 0.55;
        return (
            <View 
                style={[
                    styles.fallbackChart, 
                    { width: size, height: size, borderRadius: size / 2 }
                ]}
            >
                <View style={styles.fallbackChartInner}>
                    {data.slice(0, 4).map((item, index) => (
                        <View 
                            key={item.category}
                            style={[
                                styles.fallbackSegment,
                                { 
                                    backgroundColor: item.color,
                                    flex: item.percentage,
                                }
                            ]} 
                        />
                    ))}
                </View>
                <View 
                    style={[
                        styles.fallbackHole, 
                        { 
                            width: holeSize, 
                            height: holeSize, 
                            borderRadius: holeSize / 2,
                            top: (size - holeSize) / 2,
                            left: (size - holeSize) / 2,
                        }
                    ]} 
                />
            </View>
        );
    }

    // Calculate segments
    let cumulativePercentage = 0;
    const segments = data.map((item) => {
        const percentage = total > 0 ? item.amount / total : 0;
        const startAngle = cumulativePercentage * 360 - 90; // Start from top
        cumulativePercentage += percentage;
        const endAngle = cumulativePercentage * 360 - 90;
        
        return {
            ...item,
            startAngle,
            endAngle,
            percentage,
        };
    });

    // Create arc path
    const createArc = (startAngle: number, endAngle: number) => {
        const start = polarToCartesian(center, center, radius, endAngle);
        const end = polarToCartesian(center, center, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

        return [
            'M', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        ].join(' ');
    };

    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
        };
    };

    return (
        <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.stone100}
                strokeWidth={strokeWidth}
                fill="none"
            />
            {/* Segments */}
            {segments.map((segment, index) => {
                // Handle case where segment is 100%
                if (segment.percentage >= 0.999) {
                    return (
                        <Circle
                            key={segment.category}
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                    );
                }
                
                // Skip tiny segments
                if (segment.percentage < 0.01) return null;

                return (
                    <Path
                        key={segment.category}
                        d={createArc(segment.startAngle, segment.endAngle)}
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="butt"
                        fill="none"
                    />
                );
            })}
        </Svg>
    );
}

function LegendItem({ 
    color, 
    label, 
    amount,
    percentage 
}: { 
    color: string; 
    label: string; 
    amount: string;
    percentage: string;
}) {
    return (
        <View style={styles.legendItem}>
            <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>{label}</Text>
            </View>
            <View style={styles.legendRight}>
                <Text style={styles.legendAmount}>{amount}</Text>
                <Text style={styles.legendPercentage}>{percentage}</Text>
            </View>
        </View>
    );
}

function BarItem({ 
    height, 
    label, 
    amount,
    isActive 
}: { 
    height: number; 
    label: string; 
    amount: string;
    isActive?: boolean;
}) {
    return (
        <View style={styles.barItem}>
            <Text style={styles.barAmount}>{isActive ? amount : ''}</Text>
            <View style={styles.barContainer}>
                <View style={[
                    styles.bar,
                    {
                        height: `${height}%`,
                        backgroundColor: isActive ? colors.amber600 : colors.stone200
                    }
                ]} />
            </View>
            <Text style={[
                styles.barLabel,
                isActive && { color: colors.amber600, fontWeight: '600' }
            ]}>
                {label}
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.stone800,
        marginBottom: 12,
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
        backgroundColor: colors.stone100,
    },
    monthText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.stone700,
    },
    loadingContainer: {
        paddingVertical: 80,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.stone600,
    },
    summaryCards: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 16,
    },
    card: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
    },
    cardLabel: {
        fontSize: 14,
        color: colors.stone600,
        marginBottom: 8,
    },
    cardAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    balanceCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        color: colors.stone600,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.stone800,
        marginBottom: 16,
    },
    breakdownCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        height: 160,
    },
    chartCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.stone800,
    },
    chartLabel: {
        fontSize: 12,
        color: colors.stone500,
    },
    legend: {
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    legendLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    legendRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendLabel: {
        fontSize: 14,
        color: colors.stone800,
    },
    legendAmount: {
        fontSize: 14,
        color: colors.stone600,
    },
    legendPercentage: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.stone800,
        minWidth: 40,
        textAlign: 'right',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: colors.stone500,
    },
    trendCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 20,
    },
    barChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        height: 180,
    },
    barItem: {
        flex: 1,
        alignItems: 'center',
        gap: 8,
    },
    barAmount: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.amber600,
        height: 14,
    },
    barContainer: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '100%',
        borderRadius: 6,
        minHeight: 8,
    },
    barLabel: {
        fontSize: 12,
        color: colors.stone500,
    },
    fallbackChart: {
        borderRadius: 80,
        overflow: 'hidden',
        backgroundColor: colors.stone100,
    },
    fallbackChartInner: {
        flex: 1,
        flexDirection: 'row',
    },
    fallbackSegment: {
        height: '100%',
    },
    fallbackHole: {
        position: 'absolute',
        backgroundColor: colors.white,
    },
});
