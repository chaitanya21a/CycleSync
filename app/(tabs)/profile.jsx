import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

function MenuItem({ icon, label, value, color, onPress, showChevron = true, danger = false }) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, Platform.OS === 'web' && { cursor: 'pointer' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuIconBg, { backgroundColor: (color || COLORS.primary) + '18' }]}>
                <Ionicons name={icon} size={18} color={color || COLORS.primary} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, danger && { color: COLORS.danger }]}>{label}</Text>
                {value && <Text style={styles.menuValue}>{value}</Text>}
            </View>
            {showChevron && (
                <View style={styles.menuChevron}>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { width } = useWindowDimensions();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const desktop = width >= 1024;
    const tablet = width >= 768;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const memberSince = user?.memberSince
        ? new Date(user.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : 'N/A';

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, desktop && styles.scrollContentDesktop]}>
                <Animated.View style={[desktop && styles.desktopContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconBg}>
                            <Ionicons name="person" size={22} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.title, desktop && { fontSize: 28 }]}>Profile</Text>
                    </View>

                    {/* Desktop: two-column */}
                    <View style={[tablet && styles.twoCol]}>
                        {/* Left: Profile Card + Stats */}
                        <View style={[tablet && { flex: 1 }]}>
                            <View style={styles.profileCard}>
                                <View style={styles.avatarContainer}>
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase() : '?'}
                                        </Text>
                                    </View>
                                    <View style={styles.avatarRing} />
                                    <View style={styles.onlineDot} />
                                </View>
                                <Text style={styles.profileName}>{user?.name || 'Rider'}</Text>
                                <Text style={styles.profileEmail}>{user?.email || 'email@college.edu'}</Text>
                                <View style={styles.profileBadge}>
                                    <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
                                    <Text style={styles.profileBadgeText}>Verified Member</Text>
                                </View>
                            </View>

                            <View style={styles.statsRow}>
                                {[
                                    { icon: 'bicycle-outline', value: user?.totalRides || 0, label: 'Rides', color: COLORS.primary },
                                    { icon: 'speedometer-outline', value: user?.totalDistance || '0 km', label: 'Distance', color: COLORS.success },
                                    { icon: 'calendar-outline', value: memberSince, label: 'Member', color: COLORS.secondary },
                                ].map((stat, i) => (
                                    <View key={i} style={styles.statItem}>
                                        <Ionicons name={stat.icon} size={16} color={stat.color} />
                                        <Text style={styles.statValue}>{stat.value}</Text>
                                        <Text style={styles.statLabel}>{stat.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {tablet && <View style={{ width: 24 }} />}

                        {/* Right: Menu Cards */}
                        <View style={[tablet && { flex: 1 }]}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="person-outline" size={14} color={COLORS.textMuted} /> ACCOUNT
                            </Text>
                            <View style={styles.menuCard}>
                                <MenuItem icon="id-card-outline" label="Student Details" value={user?.studentId} color={COLORS.primary} />
                                <View style={styles.menuDivider} />
                                <MenuItem icon="call-outline" label="Phone Number" value={user?.phone} color={COLORS.info} />
                                <View style={styles.menuDivider} />
                                <MenuItem icon="mail-outline" label="Email" value={user?.email} color={COLORS.secondary} />
                            </View>

                            <Text style={styles.sectionTitle}>
                                <Ionicons name="analytics-outline" size={14} color={COLORS.textMuted} /> ACTIVITY
                            </Text>
                            <View style={styles.menuCard}>
                                <MenuItem icon="time-outline" label="Ride History" color={COLORS.primary} onPress={() => router.push('/(tabs)/history')} />
                                <View style={styles.menuDivider} />
                                <MenuItem
                                    icon="warning-outline"
                                    label="Fines & Violations"
                                    value={user?.hasFine ? 'Fine pending — contact admin' : '✓ No pending fines'}
                                    color={COLORS.warning}
                                    onPress={() => router.push('/(tabs)/history')}
                                />
                                <View style={styles.menuDivider} />
                                <MenuItem icon="bar-chart-outline" label="Usage Stats" value={`${user?.dailyUsage?.minutes ?? 0}/60 min today`} color={COLORS.success} />
                            </View>

                            <Text style={styles.sectionTitle}>
                                <Ionicons name="settings-outline" size={14} color={COLORS.textMuted} /> SETTINGS
                            </Text>
                            <View style={styles.menuCard}>
                                <MenuItem icon="notifications-outline" label="Notifications" color={COLORS.info} />
                                <View style={styles.menuDivider} />
                                <MenuItem icon="moon-outline" label="Appearance" value="Dark Mode" color={COLORS.secondary} />
                                <View style={styles.menuDivider} />
                                <MenuItem icon="help-circle-outline" label="Help & Support" color={COLORS.textSecondary} />
                                <View style={styles.menuDivider} />
                                <MenuItem icon="document-text-outline" label="Terms & Privacy" color={COLORS.textSecondary} />
                            </View>

                            <View style={[styles.menuCard, { marginTop: 4 }]}>
                                <MenuItem icon="log-out-outline" label="Sign Out" color={COLORS.danger} danger showChevron={false} onPress={handleLogout} />
                            </View>

                            <Text style={styles.versionText}>CycleSync v1.0.0 • Made with ❤️</Text>
                        </View>
                    </View>

                    <View style={{ height: 24 }} />
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
    scrollContent: { paddingHorizontal: 20, paddingTop: Platform.select({ web: 24, default: 56 }), paddingBottom: 100 },
    scrollContentDesktop: { paddingHorizontal: 40, paddingTop: 32 },
    desktopContainer: { maxWidth: 1100, alignSelf: 'center', width: '100%' },

    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
    headerIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderAccent },
    title: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold },

    twoCol: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },

    // Profile Card
    profileCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXL, padding: 32, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card },
    avatarContainer: { position: 'relative', marginBottom: 18 },
    avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: COLORS.primaryGlow, borderWidth: 3, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
    avatarRing: { position: 'absolute', width: 112, height: 112, borderRadius: 56, borderWidth: 1, borderColor: 'rgba(0,212,255,0.12)', top: -8, left: -8 },
    onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.success, borderWidth: 3, borderColor: COLORS.bgCard },
    avatarText: { fontSize: 32, color: COLORS.primary, ...FONTS.bold },
    profileName: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold },
    profileEmail: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular, marginTop: 4 },
    profileBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, paddingHorizontal: 16, paddingVertical: 7, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.successGlow, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
    profileBadgeText: { fontSize: SIZES.sm, color: COLORS.success, ...FONTS.semibold },

    // Stats
    statsRow: { flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
    statItem: { flex: 1, alignItems: 'center', gap: 6 },
    statValue: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.bold },
    statLabel: { fontSize: 11, color: COLORS.textSecondary, ...FONTS.regular },

    // Menu
    sectionTitle: { fontSize: 11, color: COLORS.textMuted, ...FONTS.semibold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 8 },
    menuCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    menuIconBg: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    menuContent: { flex: 1 },
    menuLabel: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.medium },
    menuValue: { fontSize: 12, color: COLORS.textSecondary, ...FONTS.regular, marginTop: 2 },
    menuChevron: { width: 26, height: 26, borderRadius: 8, backgroundColor: COLORS.bgInput, justifyContent: 'center', alignItems: 'center' },
    menuDivider: { height: 1, backgroundColor: COLORS.border, marginLeft: 66 },
    versionText: { textAlign: 'center', fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.regular, marginTop: 16 },
});
