import { colors } from '@/constants/colors';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/features/transactions/constants';
import type { TransactionType } from '@/features/transactions/types';
import { useTransactions } from '@/hooks/useTransactions';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
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

export default function EditScreen() {
    const params = useLocalSearchParams<{
        id: string;
        type: TransactionType;
        amount: string;
        category: string;
        description: string;
        date: string;
        receipt_url?: string;
    }>();

    const { updateTransaction, deleteTransaction } = useTransactions();
    const [type, setType] = useState<TransactionType>(params.type || 'expense');
    const [amount, setAmount] = useState(params.amount || '');
    const [category, setCategory] = useState(params.category || '');
    const [description, setDescription] = useState(params.description || '');
    const [date, setDate] = useState(params.date ? new Date(params.date) : new Date());
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Sync state when params change (important for tab-based navigation)
    useEffect(() => {
        setType(params.type || 'expense');
        setAmount(params.amount || '');
        setCategory(params.category || '');
        setDescription(params.description || '');
        setDate(params.date ? new Date(params.date) : new Date());
    }, [params.id, params.type, params.amount, params.category, params.description, params.date]);

    // Handle type change and reset category if needed
    const handleTypeChange = (newType: TransactionType) => {
        setType(newType);
        // Reset category if switching types and current category doesn't exist in new type
        const newCategories = newType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        if (!newCategories.includes(category as any)) {
            setCategory('');
        }
    };

    // Handle date change
    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    // Handle save/update transaction
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
        if (!params.id) {
            Alert.alert('Error', 'Transaction ID is missing');
            return;
        }

        // Create update object
        const updates = {
            type,
            category,
            amount,
            description,
            date: date.toISOString().split('T')[0],
        };

        // Update in Supabase
        setSaving(true);
        const result = await updateTransaction(params.id, updates);
        setSaving(false);

        if (result.success) {
            Alert.alert('Success', 'Transaction updated successfully!', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } else {
            Alert.alert('Error', result.error || 'Failed to update transaction');
        }
    };

    // Handle delete transaction
    const handleDelete = () => {
        Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!params.id) return;
                        
                        setDeleting(true);
                        const result = await deleteTransaction(params.id);
                        setDeleting(false);

                        if (result.success) {
                            router.back();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to delete transaction');
                        }
                    },
                },
            ]
        );
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
                        <View style={styles.headerRow}>
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={colors.stone800} />
                            </Pressable>
                            <Text style={styles.title}>Edit Transaction</Text>
                            <Pressable 
                                onPress={handleDelete} 
                                style={styles.deleteButton}
                                disabled={deleting}
                            >
                                <Ionicons 
                                    name="trash-outline" 
                                    size={24} 
                                    color={deleting ? colors.stone400 : colors.red600} 
                                />
                            </Pressable>
                        </View>
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
                    {params.receipt_url && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Attached Receipt</Text>
                            <View style={styles.receiptPreview}>
                                <Image
                                    source={{ uri: params.receipt_url }}
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
                        disabled={saving || deleting}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Saving...' : 'Save Changes'}
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.stone800,
    },
    deleteButton: {
        padding: 8,
        marginRight: -8,
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
