import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform, useWindowDimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';

export default function TabLayout() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;

    return (
        <Tabs
            sceneContainerStyle={{ paddingBottom: desktop ? 90 : 0 }}
            screenOptions={{
                headerShown: false,
                tabBarStyle: [styles.tabBar, desktop && styles.tabBarDesktop],
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: [styles.tabBarLabel, desktop && styles.tabBarLabelDesktop],
                tabBarItemStyle: [styles.tabBarItem, desktop && styles.tabBarItemDesktop],
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'home' : 'home-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    title: 'Scan',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'scan' : 'scan-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Spots',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'map' : 'map-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'time' : 'time-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={desktop ? 24 : 22} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.bgSecondary,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
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
        borderColor: COLORS.border,
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
        backgroundColor: COLORS.primaryGlow,
    },
    scanButton: {
        width: 36,
        height: 36,
        borderRadius: 11,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -4,
        borderWidth: 1.5,
        borderColor: COLORS.borderAccent,
        ...(Platform.OS === 'web' ? { transition: 'transform 0.2s, background-color 0.2s' } : {}),
    },
    scanButtonActive: {
        backgroundColor: COLORS.primary,
        ...SHADOWS.glow(COLORS.primary),
        ...(Platform.OS === 'web' ? { transform: 'scale(1.05)' } : {}),
    },
    scanLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        ...FONTS.semibold,
        marginTop: 2,
    },
    scanLabelActive: {
        color: COLORS.primary,
    },
});
