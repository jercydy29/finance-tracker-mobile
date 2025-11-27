import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Add Transaction Screen</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.stone50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.stone800,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: colors.stone500,
  },
});
