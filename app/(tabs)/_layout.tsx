import { colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

// Custom Add Button that floats above the tab bar
function AddTabButton({ onPress }: { onPress?: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            style={styles.addButtonContainer}
        >
            <View style={styles.addButton}>
                <Ionicons name="add" size={32} color={colors.white} />
            </View>
        </Pressable>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.amber600,
                tabBarInactiveTintColor: colors.stone500,
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.white,
                    borderTopColor: colors.stone200,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="stats-chart-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: '',
                    tabBarButton: (props) => <AddTabButton onPress={props.onPress} />,
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    title: 'Scan',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="camera-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    addButtonContainer: {
        top: -24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.amber600,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
});