import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec',
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
                            style={[styles.yearNavButton, !canGoPrevious && styles.yearNavButtonDisabled]}
                            disabled={!canGoPrevious}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={24}
                                color={canGoPrevious ? colors.stone800 : colors.stone300}
                            />
                        </Pressable>
                        
                        <Text style={[styles.yearText, !yearHasTransactions && styles.yearTextDisabled]}>
                            {pickerYear}
                        </Text>
                        
                        <Pressable
                            onPress={handleNextYear}
                            style={[styles.yearNavButton, !canGoNext && styles.yearNavButtonDisabled]}
                            disabled={!canGoNext}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={24}
                                color={canGoNext ? colors.stone800 : colors.stone300}
                            />
                        </Pressable>
                    </View>

                    {/* Month Grid (3x4) */}
                    <View style={styles.monthGrid}>
                        {MONTHS.map((month, index) => {
                            const hasTransactions = hasTransactionsInMonth(pickerYear, index);
                            const isSelected = pickerYear === selectedYear && index === selectedMonth;

                            return (
                                <Pressable
                                    key={month}
                                    style={[
                                        styles.monthButton,
                                        hasTransactions && styles.monthButtonEnabled,
                                        isSelected && styles.monthButtonSelected,
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
                                        {month}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Close Button */}
                    <Pressable style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: colors.white,
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
        color: colors.stone800,
    },
    yearTextDisabled: {
        color: colors.stone400,
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
        backgroundColor: colors.stone50,
    },
    monthButtonEnabled: {
        backgroundColor: colors.stone200,
    },
    monthButtonSelected: {
        backgroundColor: colors.amber600,
    },
    monthText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.stone400,
    },
    monthTextEnabled: {
        color: colors.stone800,
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
        color: colors.stone500,
    },
});
