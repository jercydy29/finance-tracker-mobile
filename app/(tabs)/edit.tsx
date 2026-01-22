import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryTranslationKey } from '@/features/transactions/constants';
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
import * as Haptics from 'expo-haptics';

export default function EditScreen() {
    const { colors } = useTheme();
    const { t, language } = useLanguage();
    const styles = createStyles(colors);
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
    const [amount, setAmount] = useState(params.amount || ''); // Raw value without commas
    const [displayAmount, setDisplayAmount] = useState(''); // Formatted with commas
    const [category, setCategory] = useState(params.category || '');
    const [description, setDescription] = useState(params.description || '');
    const [date, setDate] = useState(params.date ? new Date(params.date) : new Date());
    const [receiptUrl, setReceiptUrl] = useState(params.receipt_url || '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Format number with commas (locale-aware)
    const formatWithCommas = (value: string) => {
        const num = value.replace(/,/g, '');
        if (!num) return '';
        const locale = language === 'ja' ? 'ja-JP' : 'en-US';
        return Number(num).toLocaleString(locale);
    };

    // Handle amount change with formatting
    const handleAmountChange = (text: string) => {
        const rawValue = text.replace(/[^0-9]/g, '');
        setAmount(rawValue);
        setDisplayAmount(rawValue ? formatWithCommas(rawValue) : '');
    };

    // Sync state when params change (important for tab-based navigation)
    useEffect(() => {
        const rawAmount = params.amount || '';
        setType(params.type || 'expense');
        setAmount(rawAmount);
        setDisplayAmount(rawAmount ? formatWithCommas(rawAmount) : '');
        setCategory(params.category || '');
        setDescription(params.description || '');
        setDate(params.date ? new Date(params.date) : new Date());
        setReceiptUrl(params.receipt_url || '');
    }, [params.id, params.type, params.amount, params.category, params.description, params.date, params.receipt_url]);

    // Handle removing the receipt
    const handleRemoveReceipt = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            t('add.removeReceipt'),
            t('add.removeReceiptMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.remove'),
                    style: 'destructive',
                    onPress: () => setReceiptUrl(''),
                },
            ]
        );
    };

    // Handle type change and reset category if needed
    const handleTypeChange = (newType: TransactionType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            Alert.alert(t('common.error'), t('edit.errorAmount'));
            return;
        }
        if (!category) {
            Alert.alert(t('common.error'), t('edit.errorCategory'));
            return;
        }
        if (!params.id) {
            Alert.alert(t('common.error'), 'Transaction ID is missing');
            return;
        }

        // Create update object
        const updates = {
            type,
            category,
            amount,
            description,
            date: date.toISOString().split('T')[0],
            receipt_url: receiptUrl || null,
        };

        // Update in Supabase
        setSaving(true);
        const result = await updateTransaction(params.id, updates);
        setSaving(false);

        if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(t('common.success'), t('edit.success'), [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } else {
            Alert.alert(t('common.error'), result.error || 'Failed to update transaction');
        }
    };

    // Handle delete transaction
    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            t('edit.deleteConfirm'),
            t('edit.deleteMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        if (!params.id) return;

                        setDeleting(true);
                        const result = await deleteTransaction(params.id);
                        setDeleting(false);

                        if (result.success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } else {
                            Alert.alert(t('common.error'), result.error || 'Failed to delete transaction');
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
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.back();
                                }}
                                style={({ pressed }) => [
                                    styles.backButton,
                                    pressed && { transform: [{ scale: 0.9 }] },
                                ]}
                            >
                                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                            </Pressable>
                            <Text style={styles.title}>{t('edit.title')}</Text>
                            <Pressable
                                onPress={handleDelete}
                                style={({ pressed }) => [
                                    styles.deleteButton,
                                    pressed && !deleting && { transform: [{ scale: 0.9 }] },
                                ]}
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
                                {t('home.expense')}
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
                                {t('home.income')}
                            </Text>
                        </Pressable>
                    </View>

                    {/* Amount Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('add.amount')}</Text>
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
                        <Text style={styles.label}>{t('add.category')}</Text>
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
                                            {t(getCategoryTranslationKey(cat, type))}
                                        </Text>
                                    </Pressable>
                                )
                            )}
                        </View>
                    </View>

                    {/* Description Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('add.description')}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={description}
                            onChangeText={setDescription}
                            placeholder={t('add.descriptionPlaceholder')}
                            placeholderTextColor={colors.stone400}
                            multiline
                        />
                    </View>

                    {/* Date Picker */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('add.date')}</Text>
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
                                <Text style={styles.labelInRow}>{t('add.receipt')}</Text>
                                <Pressable onPress={handleRemoveReceipt} style={styles.removeButton}>
                                    <Ionicons name="close-circle" size={20} color={colors.red600} />
                                    <Text style={styles.removeButtonText}>{t('common.remove')}</Text>
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
                                    <Text style={styles.receiptText}>{t('add.receipt')}</Text>
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
                        disabled={saving || deleting}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? t('common.loading') : t('edit.saveChanges')}
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
        color: colors.textPrimary,
    },
    deleteButton: {
        padding: 8,
        marginRight: -8,
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
