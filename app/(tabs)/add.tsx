import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import type { TransactionType } from '@/features/transactions/types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/features/transactions/constants';

export default function AddScreen() {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  // Handle type change and reset category
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(''); // Reset category when switching types
  };

  // Handle save transaction
  const handleSave = () => {
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
      id: Date.now().toString(), // Temporary ID generation
      type,
      category,
      amount,
      description,
      date,
    };

    // TODO: Save to Supabase later
    console.log('Transaction to save:', transaction);

    Alert.alert(
      'Success',
      'Transaction saved! (Mock - will connect to Supabase later)',
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setAmount('');
            setCategory('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
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

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.textInput}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.stone400}
          />
        </View>

        {/* Save Button */}
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Add Transaction</Text>
        </Pressable>
      </ScrollView>
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
  saveButton: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: colors.amber600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
