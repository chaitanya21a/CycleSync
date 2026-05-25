import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getActiveSession } from '../../services/firebaseService';
import { isDesktop, getContainerStyle, responsive } from '../../constants/responsive';

// Disabled until hardware sends location data (see firebase-migration design).
// const PARKING_SPOTS = [
//     { id: 'PS-001', name: 'Institute Main Gate', capacity: 20, currentCount: 12, icon: '🚪' },
//     { id: 'PS-002', name: 'Mega Girls Hostel', capacity: 15, currentCount: 8, icon: '📚' },
//     { id: 'PS-003', name: 'Saraswati Girls Hostel', capacity: 25, currentCount: 18, icon: '🏠' },
//     { id: 'PS-004', name: 'Mega Boys Hostel', capacity: 10, currentCount: 6, icon: '🍽️' },
//     { id: 'PS-005', name: 'Krishna Boys Hostel', capacity: 15, currentCount: 4, icon: '⚽' },
//     { id: 'PS-006', name: 'Civil Engineering Dept', capacity: 20, currentCount: 14, icon: '🎓' },
//     { id: 'PS-007', name: 'Chemical Engineering Dept', capacity: 10, currentCount: 3, icon: '🏢' },
//     { id: 'PS-008', name: 'IT Park', capacity: 12, currentCount: 7, icon: '🔧' },
// ];

function AnimatedStatCard({ icon, label, value, color, glowColor, delay, style }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const countAnim = useRef(new Animated.Value(0)).current;
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, delay, useNativeDriver: true, tension: 70, friction: 8 }),
        ]).start();

        // Animate counter
        const numVal = typeof value === 'number' ? value : parseInt(value) || 0;
        Animated.timing(countAnim, { toValue: numVal, duration: 1200, delay: delay + 200, useNativeDriver: false }).start();
        countAnim.addListener(({ value: v }) => setDisplayVal(Math.round(v)));
        return () => countAnim.removeAllListeners();
    }, []);

    return (
        <Animated.View
            style={[
                styles.statCard,
                style,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
        >
            <View style={styles.statCardTop}>
                <View style={[styles.statIconContainer, { backgroundColor: glowColor }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <View style={[styles.statTrend, { backgroundColor: glowColor }]}>
                    <Ionicons name="trending-up" size={12} color={color} />
                </View>
            </View>
            <Text style={styles.statValue}>
                {typeof value === 'number' ? displayVal : value}
            </Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
}

function QuickAction({ icon, label, color, onPress, delay, disabled }) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, delay, useNativeDriver: true, tension: 80 }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                style={[styles.quickAction, disabled && styles.quickActionDisabled]}
                onPress={disabled ? null : onPress}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={disabled}
            >
                <View style={[styles.quickActionIcon, { backgroundColor: disabled ? COLORS.border : color + '18' }]}>
                    <Ionicons name={icon} size={24} color={disabled ? COLORS.textMuted : color} />
                </View>
                <Text style={[styles.quickActionLabel, disabled && { color: COLORS.textMuted }]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeSession, setActiveSession] = useState(null);
    const { width } = useWindowDimensions();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const bannerSlide = useRef(new Animated.Value(-50)).current;

    const desktop = width >= 1024;
    const tablet = width >= 768;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();
    }, []);

    useEffect(() => {
        if (user?.rfidUid) {
            getActiveSession(user.rfidUid).then(setActiveSession).catch(() => {});
        }
    }, [user?.rfidUid]);

    useEffect(() => {
        if (activeSession) {
            Animated.spring(bannerSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
        }
    }, [activeSession]);

    const isSuspended = user?.isBanned || user?.isAllowed === false;
    const dailyPercentage = user ? Math.round(((user.dailyUsage?.minutes || 0) / 60) * 100) : 0;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    desktop && styles.scrollContentDesktop,
                ]}
            >
                <View style={[desktop && styles.desktopContainer]}>
                    {/* Header */}
                    <Animated.View
                        style={[
                            styles.header,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <View style={styles.headerLeft}>
                            <View style={styles.avatarSmall}>
                                <Text style={styles.avatarSmallText}>
                                    {user?.name?.[0]?.toUpperCase() || '?'}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                                <Text style={[styles.userName, desktop && styles.userNameDesktop]}>
                                    {user?.name || 'Rider'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.headerBtn}>
                                <Ionicons name="search-outline" size={22} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.headerBtn}
                                onPress={() => router.push('/(tabs)/profile')}
                            >
                                <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
                                <View style={styles.notifDot} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Active Ride Banner */}
                    {activeSession && (
                        <Animated.View style={{ transform: [{ translateX: bannerSlide }] }}>
                            <TouchableOpacity
                                style={styles.activeRideBanner}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/ride/${activeSession?.sessionId}`)}
                            >
                                <View style={styles.activeRideLeft}>
                                    <View style={styles.pulsingDot}>
                                        <View style={styles.pulsingDotInner} />
                                    </View>
                                    <View>
                                        <Text style={styles.activeRideTitle}>🚴 Ride in Progress</Text>
                                        <Text style={styles.activeRideSub}>{activeSession?.bicycleId || 'Bicycle'} • Tap to view</Text>
                                    </View>
                                </View>
                                <View style={styles.activeRideArrow}>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Suspension Banner */}
                    {isSuspended && (
                        <View style={styles.suspensionBanner}>
                            <View style={styles.suspensionIconBg}>
                                <Ionicons name="ban-outline" size={22} color={COLORS.danger} />
                            </View>
                            <View style={styles.suspensionInfo}>
                                <Text style={styles.suspensionTitle}>Your account has been suspended</Text>
                                <Text style={styles.suspensionSub}>Contact admin to resolve this issue</Text>
                            </View>
                        </View>
                    )}

                    {/* Desktop: Two-column layout */}
                    <View style={[tablet && styles.twoColumnLayout]}>
                        {/* Left column */}
                        <View style={[tablet && { flex: 1 }]}>
                            {/* Daily Usage Card */}
                            <Animated.View
                                style={[
                                    styles.usageCard,
                                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                                ]}
                            >
                                <View style={styles.usageHeader}>
                                    <View style={styles.usageTitleRow}>
                                        <View style={styles.usageIconBg}>
                                            <Ionicons name="timer-outline" size={18} color={COLORS.primary} />
                                        </View>
                                        <Text style={styles.usageTitle}>Today's Usage</Text>
                                    </View>
                                    <View style={styles.usageBadge}>
                                        <Ionicons name="flash" size={12} color={COLORS.primary} />
                                        <Text style={styles.usageBadgeText}>
                                            {user?.dailyUsage?.minutes || 0}/{user?.maxDailyUsage || 60}m
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.usageStats}>
                                    <View style={styles.usageStatItem}>
                                        <Text style={styles.usageStatValue}>{user?.dailyUsage?.minutes || 0}</Text>
                                        <Text style={styles.usageStatLabel}>min used</Text>
                                    </View>
                                    <View style={styles.usageStatDivider} />
                                    <View style={styles.usageStatItem}>
                                        <Text style={[styles.usageStatValue, { color: COLORS.success }]}>
                                            {60 - (user?.dailyUsage?.minutes || 0)}
                                        </Text>
                                        <Text style={styles.usageStatLabel}>min left</Text>
                                    </View>
                                    <View style={styles.usageStatDivider} />
                                    <View style={styles.usageStatItem}>
                                        <Text style={styles.usageStatValue}>20</Text>
                                        <Text style={styles.usageStatLabel}>max/ride</Text>
                                    </View>
                                </View>

                                <View style={styles.progressBarContainer}>
                                    <View style={styles.progressBarBg}>
                                        <Animated.View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${dailyPercentage}%`,
                                                    backgroundColor:
                                                        dailyPercentage > 80
                                                            ? COLORS.danger
                                                            : dailyPercentage > 50
                                                                ? COLORS.warning
                                                                : COLORS.success,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressPercentage}>{dailyPercentage}%</Text>
                                </View>
                            </Animated.View>

                            {/* Quick Actions */}
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="flash-outline" size={18} color={COLORS.textPrimary} /> Quick Actions
                            </Text>
                            <View style={[styles.quickActionsRow, desktop && styles.quickActionsRowDesktop]}>
                                {/* Scan QR — disabled until ESP32/hardware writes sessions + location to Firebase */}
                                {/* <QuickAction
                                    icon="qr-code-outline"
                                    label="Scan QR"
                                    color={COLORS.primary}
                                    onPress={() => router.push('/(tabs)/scan')}
                                    delay={0}
                                    disabled={isSuspended}
                                /> */}
                                {/* Find Spots — disabled until hardware provides location data */}
                                {/* <QuickAction
                                    icon="map-outline"
                                    label="Find Spots"
                                    color={COLORS.success}
                                    onPress={() => router.push('/(tabs)/map')}
                                    delay={80}
                                /> */}
                                <QuickAction
                                    icon="time-outline"
                                    label="History"
                                    color={COLORS.secondary}
                                    onPress={() => router.push('/(tabs)/history')}
                                    delay={0}
                                />
                                <QuickAction
                                    icon="receipt-outline"
                                    label="Fines"
                                    color={COLORS.warning}
                                    onPress={() => router.push('/(tabs)/history')}
                                    delay={80}
                                />
                            </View>
                        </View>

                        {/* Right column on tablet/desktop */}
                        {tablet && <View style={styles.columnGap} />}

                        <View style={[tablet && { flex: 1 }]}>
                            {/* Fleet Stats — removed mock data; fleet overview not available without admin query */}
                        </View>
                    </View>

                    {/* Nearby Parking — disabled until hardware provides location data */}
                    {/* <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            <Ionicons name="location-outline" size={18} color={COLORS.textPrimary} /> Nearby Parking
                        </Text>
                        <TouchableOpacity
                            style={styles.seeAllBtn}
                            onPress={() => router.push('/(tabs)/map')}
                        >
                            <Text style={styles.seeAllText}>See All</Text>
                            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.spotsScroll}
                    >
                        {PARKING_SPOTS.map((spot, index) => {
                            const available = spot.capacity - spot.currentCount;
                            const usage = spot.currentCount / spot.capacity;
                            return (
                                <TouchableOpacity key={spot.id} style={styles.spotCard} activeOpacity={0.7}>
                                    <View style={styles.spotCardHeader}>
                                        <Text style={styles.spotIcon}>{spot.icon}</Text>
                                        <View
                                            style={[
                                                styles.spotStatusDot,
                                                { backgroundColor: usage > 0.8 ? COLORS.warning : COLORS.success },
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
                                    <View style={styles.spotCapacityBar}>
                                        <View style={styles.spotCapacityBg}>
                                            <View
                                                style={[
                                                    styles.spotCapacityFill,
                                                    {
                                                        width: `${usage * 100}%`,
                                                        backgroundColor: usage > 0.8 ? COLORS.warning : COLORS.success,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.spotCapacityRow}>
                                        <Ionicons name="bicycle-outline" size={12} color={COLORS.textMuted} />
                                        <Text style={styles.spotCapacityText}>
                                            {available} available
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView> */}

                    {/* Pending Fines */}
                    {user?.hasFine && (
                        <TouchableOpacity
                            style={styles.finesBanner}
                            activeOpacity={0.7}
                            onPress={() => router.push('/(tabs)/history')}
                        >
                            <View style={styles.finesIconBg}>
                                <Ionicons name="alert-circle" size={22} color={COLORS.warning} />
                            </View>
                            <View style={styles.finesInfo}>
                                <Text style={styles.finesTitle}>You have a pending fine</Text>
                                <Text style={styles.finesAmount}>Overtime violation — contact admin</Text>
                            </View>
                            <View style={styles.payBtn}>
                                <Text style={styles.payBtnText}>View</Text>
                                <Ionicons name="chevron-forward" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 24 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: Platform.select({ web: 24, default: 56 }),
        paddingBottom: 20,
    },
    scrollContentDesktop: {
        paddingHorizontal: 40,
        paddingTop: 32,
        paddingBottom: 40,
    },
    desktopContainer: {
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: Platform.select({ web: 0, default: 0 }),
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarSmall: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.borderAccent,
    },
    avatarSmallText: {
        fontSize: 20,
        color: COLORS.primary,
        ...FONTS.bold,
    },
    greeting: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        ...FONTS.regular,
    },
    userName: {
        fontSize: SIZES.xl,
        color: COLORS.textPrimary,
        ...FONTS.bold,
        marginTop: 2,
    },
    userNameDesktop: {
        fontSize: 26,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 8,
    },
    headerBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: COLORS.bgCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    notifDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.danger,
        borderWidth: 2,
        borderColor: COLORS.bgCard,
    },

    // Active Ride
    activeRideBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.primaryGlow,
        borderRadius: SIZES.radiusLG,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.borderAccent,
    },
    activeRideLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    pulsingDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'rgba(0, 212, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulsingDotInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    activeRideTitle: {
        fontSize: SIZES.md,
        color: COLORS.primary,
        ...FONTS.semibold,
    },
    activeRideSub: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        marginTop: 2,
    },
    activeRideArrow: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 212, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Two-column
    twoColumnLayout: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    columnGap: {
        width: 24,
    },

    // Usage Card
    usageCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusXL,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    usageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    usageTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    usageIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    usageTitle: {
        fontSize: SIZES.lg,
        color: COLORS.textPrimary,
        ...FONTS.semibold,
    },
    usageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primaryGlow,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: SIZES.radiusFull,
        borderWidth: 1,
        borderColor: COLORS.borderAccent,
    },
    usageBadgeText: {
        fontSize: 11,
        color: COLORS.primary,
        ...FONTS.bold,
    },
    usageStats: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    usageStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    usageStatValue: {
        fontSize: 22,
        color: COLORS.textPrimary,
        ...FONTS.bold,
    },
    usageStatLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        ...FONTS.regular,
        marginTop: 2,
    },
    usageStatDivider: {
        width: 1,
        backgroundColor: COLORS.border,
        marginVertical: 4,
    },
    progressBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.bgInput,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressPercentage: {
        fontSize: 12,
        color: COLORS.textSecondary,
        ...FONTS.bold,
        minWidth: 32,
        textAlign: 'right',
    },

    // Sections
    sectionTitle: {
        fontSize: SIZES.lg,
        color: COLORS.textPrimary,
        ...FONTS.semibold,
        marginBottom: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        color: COLORS.primary,
        fontSize: SIZES.sm,
        ...FONTS.medium,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCardHalf: {
        flex: 1,
        minWidth: '47%',
        maxWidth: '48%',
    },
    statCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusLG,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        minHeight: 120,
        ...(Platform.OS === 'web' ? { transition: 'transform 0.2s, box-shadow 0.2s' } : {}),
    },
    statCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statTrend: {
        width: 26,
        height: 26,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        color: COLORS.textPrimary,
        ...FONTS.bold,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        ...FONTS.regular,
    },

    // Quick Actions
    quickActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    quickActionsRowDesktop: {
        justifyContent: 'flex-start',
        gap: 16,
    },
    quickAction: {
        alignItems: 'center',
        gap: 10,
        flex: 1,
        maxWidth: 100,
    },
    quickActionIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    quickActionLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        ...FONTS.medium,
        textAlign: 'center',
    },
    quickActionDisabled: {
        opacity: 0.5,
    },

    // Suspension Banner
    suspensionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: SIZES.radiusLG,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        gap: 12,
    },
    suspensionIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suspensionInfo: {
        flex: 1,
    },
    suspensionTitle: {
        fontSize: SIZES.md,
        color: COLORS.danger,
        ...FONTS.semibold,
    },
    suspensionSub: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        marginTop: 2,
    },

    // Parking Spots
    spotsScroll: {
        paddingBottom: 4,
        gap: 12,
        marginBottom: 20,
    },
    spotCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusLG,
        padding: 14,
        width: 150,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    spotCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    spotIcon: {
        fontSize: 26,
    },
    spotStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    spotName: {
        fontSize: SIZES.sm,
        color: COLORS.textPrimary,
        ...FONTS.semibold,
        marginBottom: 10,
    },
    spotCapacityBar: {
        marginBottom: 6,
    },
    spotCapacityBg: {
        height: 4,
        backgroundColor: COLORS.bgInput,
        borderRadius: 2,
        overflow: 'hidden',
    },
    spotCapacityFill: {
        height: '100%',
        borderRadius: 2,
    },
    spotCapacityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    spotCapacityText: {
        fontSize: 11,
        color: COLORS.textMuted,
        ...FONTS.regular,
    },

    // Fines
    finesBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.warningGlow,
        borderRadius: SIZES.radiusLG,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        gap: 12,
        marginTop: 4,
    },
    finesIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    finesInfo: {
        flex: 1,
    },
    finesTitle: {
        fontSize: SIZES.md,
        color: COLORS.warning,
        ...FONTS.semibold,
    },
    finesAmount: {
        fontSize: SIZES.xs,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        marginTop: 2,
    },
    payBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.warning,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: SIZES.radiusSM,
    },
    payBtnText: {
        color: '#fff',
        fontSize: SIZES.sm,
        ...FONTS.semibold,
    },
});
