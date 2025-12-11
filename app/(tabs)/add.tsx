import { useTheme } from '@/contexts/ThemeContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/features/transactions/constants';
import type { TransactionType } from '@/features/transactions/types';
import { useTransactions } from '@/hooks/useTransactions';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function AddScreen() {
    const { colors } = useTheme();
    const styles = createStyles(colors);
    const params = useLocalSearchParams<{
        receiptUrl?: string;
        amount?: string;
        category?: string;
        description?: string;
        date?: string;
    }>();

    const { addTransaction } = useTransactions();
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState(params.amount || ''); // Raw value without commas
    const [displayAmount, setDisplayAmount] = useState(''); // Formatted with commas
    const [category, setCategory] = useState(params.category || '');
    const [description, setDescription] = useState(params.description || '');
    const [date, setDate] = useState(params.date ? new Date(params.date) : new Date());
    const [receiptUrl, setReceiptUrl] = useState(params.receiptUrl || '');
    const [saving, setSaving] = useState(false);

    // Format number with commas
    const formatWithCommas = (value: string) => {
        const num = value.replace(/,/g, '');
        if (!num) return '';
        return Number(num).toLocaleString('ja-JP');
    };

    // Handle amount change with formatting
    const handleAmountChange = (text: string) => {
        // Remove non-numeric characters except for the input
        const rawValue = text.replace(/[^0-9]/g, '');
        setAmount(rawValue);
        setDisplayAmount(rawValue ? formatWithCommas(rawValue) : '');
    };

    // Sync form state when URL params change (e.g., new receipt scanned)
    useEffect(() => {
        const rawAmount = params.amount || '';
        setAmount(rawAmount);
        setDisplayAmount(rawAmount ? formatWithCommas(rawAmount) : '');
        setCategory(params.category || '');
        setDescription(params.description || '');
        setDate(params.date ? new Date(params.date) : new Date());
        setReceiptUrl(params.receiptUrl || '');
    }, [params.amount, params.category, params.description, params.date, params.receiptUrl]);

    // Handle removing the receipt and clearing OCR-populated fields
    const handleRemoveReceipt = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Remove Receipt',
            'This will also clear the auto-filled fields (amount, category, description, date). Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setReceiptUrl('');
                        setAmount('');
                        setDisplayAmount('');
                        setCategory('');
                        setDescription('');
                        setDate(new Date());
                    },
                },
            ]
        );
    };

    // Handle type change and reset category
    const handleTypeChange = (newType: TransactionType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setType(newType);
        setCategory(''); // Reset category when switching types
    };

    // Handle date change
    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    // Handle save transaction
    const handleSave = async () => {
        // Validation
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid amount');
            return;
        }
        if (!category) {
            Alert.alert('Validation Error', 'Please select a category');
            return;
        }
        if (!date) {
            Alert.alert('Validation Error', 'Please enter a date');
            return;
        }

        // Create transaction object
        const transaction = {
            type,
            category,
            amount,
            description,
            date: date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
            receipt_url: receiptUrl || null,
        };

        // Save to Supabase
        setSaving(true);
        const result = await addTransaction(transaction);
        setSaving(false);

        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Transaction added successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Reset form
                        setAmount('');
                        setDisplayAmount('');
                        setCategory('');
                        setDescription('');
                        setDate(new Date());
                        // Navigate back to home (replace to avoid stacking)
                        router.replace('/');
                    },
                },
            ]);
        } else {
            Alert.alert('Error', result.error || 'Failed to add transaction');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollView}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Transaction</Text>
                    </View>

                    {/* Type Toggle */}
                    <View style={styles.typeContainer}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.typeButton,
                                type === 'expense' && styles.typeButtonActiveExpense,
                                { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
                                pressed && { transform: [{ scale: 0.95 }] },
                            ]}
                            onPress={() => handleTypeChange('expense')}
                        >
                            <Text
                                style={[
                                    styles.typeButtonText,
                                    type === 'expense' && styles.typeButtonTextActive,
                                ]}
                            >
                                Expense
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [
                                styles.typeButton,
                                type === 'income' && styles.typeButtonActiveIncome,
                                { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
                                pressed && { transform: [{ scale: 0.95 }] },
                            ]}
                            onPress={() => handleTypeChange('income')}
                        >
                            <Text
                                style={[
                                    styles.typeButtonText,
                                    type === 'income' && styles.typeButtonTextActive,
                                ]}
                            >
                                Income
                            </Text>
                        </Pressable>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Amount</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currencySymbol}>¥</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={displayAmount}
                                onChangeText={handleAmountChange}
                                placeholder="0"
                                placeholderTextColor={colors.stone400}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>

                    {/* Category Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.categoryGrid}>
                            {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(
                                (cat) => (
                                    <Pressable
                                        key={cat}
                                        style={({ pressed }) => [
                                            styles.categoryButton,
                                            category === cat && styles.categoryButtonActive,
                                            pressed && { transform: [{ scale: 0.95 }] },
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setCategory(cat);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryButtonText,
                                                category === cat && styles.categoryButtonTextActive,
                                            ]}
                                        >
                                            {cat}
                                        </Text>
                                    </Pressable>
                                )
                            )}
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={styles.textInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Add a note..."
                            placeholderTextColor={colors.stone400}
                            multiline
                        />
                    </View>

                    {/* Date Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Date</Text>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            accentColor={colors.amber600}
                        />
                    </View>

                    {/* Receipt Preview */}
                    {receiptUrl && (
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.labelInRow}>Attached Receipt</Text>
                                <Pressable onPress={handleRemoveReceipt} style={styles.removeButton}>
                                    <Ionicons name="close-circle" size={20} color={colors.red600} />
                                    <Text style={styles.removeButtonText}>Remove</Text>
                                </Pressable>
                            </View>
                            <View style={styles.receiptPreview}>
                                <Image
                                    source={{ uri: receiptUrl }}
                                    style={styles.receiptImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.receiptInfo}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.emerald600} />
                                    <Text style={styles.receiptText}>Receipt attached</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Save Button */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            saving && styles.saveButtonDisabled,
                            pressed && !saving && { transform: [{ scale: 0.98 }] },
                        ]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Saving...' : 'Add Transaction'}
                        </Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    typeContainer: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginBottom: 24,
        backgroundColor: colors.surfaceSecondary,
        borderRadius: 12,
        padding: 4,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    typeButtonActiveExpense: {
        backgroundColor: colors.red600,
    },
    typeButtonActiveIncome: {
        backgroundColor: colors.emerald600,
    },
    typeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    typeButtonTextActive: {
        color: colors.white,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginHorizontal: 24,
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    labelInRow: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    removeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    removeButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.red600,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.textPrimary,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        color: colors.textPrimary,
        paddingVertical: 16,
    },
    textInput: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        minHeight: 140,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryButtonActive: {
        backgroundColor: colors.amber600,
        borderColor: colors.amber600,
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    categoryButtonTextActive: {
        color: colors.white,
    },
    receiptPreview: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12,
    },
    receiptImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
    },
    receiptInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    receiptText: {
        fontSize: 14,
        color: colors.emerald600,
        fontWeight: '500',
    },
    saveButton: {
        marginHorizontal: 24,
        marginBottom: 32,
        backgroundColor: colors.amber600,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: colors.textPlaceholder,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
});
