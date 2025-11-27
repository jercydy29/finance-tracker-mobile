import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@/constants/colors';

export default function StatsScreen() {
  const currentMonth = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.month}>{currentMonth}</Text>
      </View>

      {/* Income/Expenses Cards */}
      <View style={styles.summaryCards}>
        <View style={[styles.card, { backgroundColor: colors.mintGreen }]}>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={[styles.cardAmount, { color: colors.emerald700 }]}>
            $5,200
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.lightPink }]}>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={[styles.cardAmount, { color: colors.red600 }]}>
            $914
          </Text>
        </View>
      </View>

      {/* Expense Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <View style={styles.breakdownCard}>
          {/* Chart placeholder */}
          <View style={styles.chartPlaceholder}>
            <View style={styles.donutChart}>
              <Text style={styles.chartTotal}>$914</Text>
              <Text style={styles.chartLabel}>Total</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <LegendItem color="#f59e0b" label="Food" percentage="37%" />
            <LegendItem color="#06b6d4" label="Transport" percentage="22%" />
            <LegendItem color="#ec4899" label="Shopping" percentage="17%" />
            <LegendItem color="#8b5cf6" label="Entertainment" percentage="12%" />
            <LegendItem color="#6b7280" label="Other" percentage="12%" />
          </View>
        </View>
      </View>

      {/* Monthly Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Trend</Text>
        <View style={styles.trendCard}>
          <View style={styles.barChart}>
            <BarItem height={30} label="Jul" />
            <BarItem height={45} label="Aug" />
            <BarItem height={35} label="Sep" />
            <BarItem height={40} label="Oct" />
            <BarItem height={80} label="Nov" isActive />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function LegendItem({ color, label, percentage }: { color: string; label: string; percentage: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={styles.legendLeft}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={styles.legendPercentage}>{percentage}</Text>
    </View>
  );
}

function BarItem({ height, label, isActive }: { height: number; label: string; isActive?: boolean }) {
  return (
    <View style={styles.barItem}>
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
    marginBottom: 4,
  },
  month: {
    fontSize: 16,
    color: colors.stone600,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
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
  chartPlaceholder: {
    alignItems: 'center',
    marginBottom: 24,
  },
  donutChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 30,
    borderColor: colors.stone200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTotal: {
    fontSize: 24,
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
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    color: colors.stone800,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.stone800,
  },
  trendCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    height: 160,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 20,
  },
  barLabel: {
    fontSize: 12,
    color: colors.stone500,
  },
});
