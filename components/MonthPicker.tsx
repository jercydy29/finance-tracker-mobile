import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const MONTH_KEYS = [
    'jan', 'feb', 'mar', 'apr',
    'may', 'jun', 'jul', 'aug',
    'sep', 'oct', 'nov', 'dec',
];

type MonthPickerProps = {
    visible: boolean;
    onClose: () => void;
    selectedYear: number;
    selectedMonth: number;
    onSelectMonth: (year: number, month: number) => void;
    hasTransactionsInMonth: (year: number, month: number) => boolean;
    getPreviousYearWithTransactions: (year: number) => number | null;
    getNextYearWithTransactions: (year: number) => number | null;
    availableYears: number[];
};

export function MonthPicker({
    visible,
    onClose,
    selectedYear,
    selectedMonth,
    onSelectMonth,
    hasTransactionsInMonth,
    getPreviousYearWithTransactions,
    getNextYearWithTransactions,
    availableYears,
}: MonthPickerProps) {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const styles = createStyles(colors);
    const [pickerYear, setPickerYear] = useState(selectedYear);

    const previousYear = getPreviousYearWithTransactions(pickerYear);
    const nextYear = getNextYearWithTransactions(pickerYear);
    
    const canGoPrevious = previousYear !== null;
    const canGoNext = nextYear !== null;

    const handlePreviousYear = () => {
        if (previousYear !== null) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerYear(previousYear);
        }
    };

    const handleNextYear = () => {
        if (nextYear !== null) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setPickerYear(nextYear);
        }
    };

    const handleSelectMonth = (monthIndex: number) => {
        if (hasTransactionsInMonth(pickerYear, monthIndex)) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelectMonth(pickerYear, monthIndex);
            onClose();
        }
    };

    const handleClose = () => {
        setPickerYear(selectedYear); // Reset to selected year on close
        onClose();
    };

    // Check if this year has any transactions
    const yearHasTransactions = availableYears.includes(pickerYear);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
                    {/* Year Navigation */}
                    <View style={styles.yearNav}>
                        <Pressable
                            onPress={handlePreviousYear}
                            style={({ pressed }) => [
                                styles.yearNavButton,
                                !canGoPrevious && styles.yearNavButtonDisabled,
                                pressed && canGoPrevious && { transform: [{ scale: 0.9 }] },
                            ]}
                            disabled={!canGoPrevious}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={24}
                                color={canGoPrevious ? colors.textPrimary : colors.textPlaceholder}
                            />
                        </Pressable>

                        <Text style={[styles.yearText, !yearHasTransactions && styles.yearTextDisabled]}>
                            {pickerYear}
                        </Text>

                        <Pressable
                            onPress={handleNextYear}
                            style={({ pressed }) => [
                                styles.yearNavButton,
                                !canGoNext && styles.yearNavButtonDisabled,
                                pressed && canGoNext && { transform: [{ scale: 0.9 }] },
                            ]}
                            disabled={!canGoNext}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={24}
                                color={canGoNext ? colors.textPrimary : colors.textPlaceholder}
                            />
                        </Pressable>
                    </View>

                    {/* Month Grid (3x4) */}
                    <View style={styles.monthGrid}>
                        {MONTH_KEYS.map((monthKey, index) => {
                            const hasTransactions = hasTransactionsInMonth(pickerYear, index);
                            const isSelected = pickerYear === selectedYear && index === selectedMonth;

                            return (
                                <Pressable
                                    key={monthKey}
                                    style={({ pressed }) => [
                                        styles.monthButton,
                                        hasTransactions && styles.monthButtonEnabled,
                                        isSelected && styles.monthButtonSelected,
                                        pressed && hasTransactions && { transform: [{ scale: 0.95 }] },
                                    ]}
                                    onPress={() => handleSelectMonth(index)}
                                    disabled={!hasTransactions}
                                >
                                    <Text
                                        style={[
                                            styles.monthText,
                                            hasTransactions && styles.monthTextEnabled,
                                            isSelected && styles.monthTextSelected,
                                        ]}
                                    >
                                        {t(`monthPicker.months.${monthKey}`)}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Close Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && { transform: [{ scale: 0.98 }] },
                        ]}
                        onPress={handleClose}
                    >
                        <Text style={styles.closeButtonText}>{t('monthPicker.cancel')}</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 340,
    },
    yearNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    yearNavButton: {
        padding: 8,
        borderRadius: 8,
    },
    yearNavButtonDisabled: {
        opacity: 0.3,
    },
    yearText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    yearTextDisabled: {
        color: colors.textPlaceholder,
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    monthButton: {
        width: '30%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    monthButtonEnabled: {
        backgroundColor: colors.surfaceSecondary,
    },
    monthButtonSelected: {
        backgroundColor: colors.amber600,
    },
    monthText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.textPlaceholder,
    },
    monthTextEnabled: {
        color: colors.textPrimary,
        fontWeight: '600',
    },
    monthTextSelected: {
        color: colors.white,
        fontWeight: '600',
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 14,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
    },
});
