import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';

export default function AdminLayout() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;

    return (
        <Tabs
            sceneContainerStyle={{ paddingBottom: desktop ? 90 : 0 }}
            screenOptions={{
                headerShown: false,
                tabBarStyle: [styles.tabBar, desktop && styles.tabBarDesktop],
                tabBarActiveTintColor: '#F59E0B',
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: [styles.tabBarLabel, desktop && styles.tabBarLabelDesktop],
                tabBarItemStyle: [styles.tabBarItem, desktop && styles.tabBarItemDesktop],
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Overview',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="bicycles"
                options={{
                    title: 'Bicycles',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'bicycle' : 'bicycle-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="users"
                options={{
                    title: 'Users',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'people' : 'people-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="rides"
                options={{
                    title: 'Rides',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'navigate' : 'navigate-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="fines"
                options={{
                    title: 'Fines',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'cash' : 'cash-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="qr-codes"
                options={{
                    title: 'QR Codes',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#1a1200',
        borderTopWidth: 1,
        borderTopColor: '#3d2e00',
        height: Platform.OS === 'ios' ? 88 : 68,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: 8,
        ...SHADOWS.card,
    },
    tabBarDesktop: {
        height: 64,
        paddingBottom: 8,
        paddingTop: 8,
        paddingHorizontal: 40,
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#3d2e00',
        position: 'absolute',
        bottom: 0,
        left: '50%',
        ...(Platform.OS === 'web' ? { transform: 'translateX(-50%)' } : { transform: [{ translateX: -300 }] }),
    },
    tabBarLabel: {
        fontSize: 11,
        ...FONTS.semibold,
        marginTop: 2,
    },
    tabBarLabelDesktop: {
        fontSize: 12,
    },
    tabBarItem: {
        paddingTop: 4,
    },
    tabBarItemDesktop: {
        paddingTop: 2,
    },
    iconContainer: {
        padding: 4,
        borderRadius: 10,
    },
    iconContainerActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
});
