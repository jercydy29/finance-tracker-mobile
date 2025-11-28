import { colors } from '@/constants/colors';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/features/transactions/constants';
import type { TransactionType } from '@/features/transactions/types';
import { useTransactions } from '@/hooks/useTransactions';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
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
    const { receiptUrl } = useLocalSearchParams<{ receiptUrl?: string }>();
    const { addTransaction } = useTransactions();
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [saving, setSaving] = useState(false);

    // Handle type change and reset category
    const handleTypeChange = (newType: TransactionType) => {
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
            Alert.alert('Success', 'Transaction added successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Reset form
                        setAmount('');
                        setCategory('');
                        setDescription('');
                        setDate(new Date());
                        // Navigate back to home
                        router.push('/');
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
                            style={[
                                styles.typeButton,
                                type === 'expense' && styles.typeButtonActiveExpense,
                                { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
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
                            style={[
                                styles.typeButton,
                                type === 'income' && styles.typeButtonActiveIncome,
                                { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
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
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0.00"
                                placeholderTextColor={colors.stone400}
                                keyboardType="decimal-pad"
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
                                        style={[
                                            styles.categoryButton,
                                            category === cat && styles.categoryButtonActive,
                                        ]}
                                        onPress={() => setCategory(cat)}
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
                            <Text style={styles.label}>Attached Receipt</Text>
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
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.stone50,
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
        color: colors.stone800,
    },
    typeContainer: {
        flexDirection: 'row',
        marginHorizontal: 24,
        marginBottom: 24,
        backgroundColor: colors.stone100,
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
        color: colors.stone800,
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
        color: colors.stone700,
        marginBottom: 8,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.stone200,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.stone800,
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        color: colors.stone800,
        paddingVertical: 16,
    },
    textInput: {
        backgroundColor: colors.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.stone800,
        borderWidth: 1,
        borderColor: colors.stone200,
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
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.stone200,
    },
    categoryButtonActive: {
        backgroundColor: colors.amber600,
        borderColor: colors.amber600,
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.stone700,
    },
    categoryButtonTextActive: {
        color: colors.white,
    },
    receiptPreview: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.stone200,
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
        backgroundColor: colors.stone400,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.white,
    },
});
