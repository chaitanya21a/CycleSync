import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboardStats } from '../../services/firebaseService';

const ADMIN_ACCENT = '#F59E0B';
const ADMIN_GLOW = 'rgba(245, 158, 11, 0.15)';

function formatSessionTime(t) {
    const d = typeof t === 'string' && t.includes(' ')
        ? new Date(t.replace(' ', 'T'))
        : new Date(t);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOverview() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const router = useRouter();
    const { logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();
        (async () => {
            try {
                const data = await getAdminDashboardStats();
                setStats(data);
            } catch {
                setStats(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const statCards = stats
        ? [
            { label: 'Total Users', value: stats.totalUsers, icon: 'people', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
            { label: 'Active Rides', value: stats.activeRides, icon: 'bicycle', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
            { label: "Today's Rides", value: stats.todayRides, icon: 'trending-up', color: COLORS.primary, bg: COLORS.primaryGlow },
            { label: 'Total Rides', value: stats.totalRides, icon: 'navigate', color: COLORS.success, bg: COLORS.successGlow },
            { label: 'Pending Fines', value: stats.pendingFinesCount, icon: 'alert-circle', color: COLORS.warning, bg: COLORS.warningGlow },
            { label: 'Fine Amount', value: `₹${stats.pendingFinesAmount}`, icon: 'cash', color: COLORS.warning, bg: COLORS.warningGlow },
            { label: 'Banned Users', value: stats.bannedUsers, icon: 'ban', color: COLORS.danger, bg: COLORS.dangerGlow },
        ]
        : [];

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={ADMIN_ACCENT} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.adminBadgeRow}>
                            <View style={styles.adminBadge}>
                                <Ionicons name="shield-checkmark" size={12} color={ADMIN_ACCENT} />
                                <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                        </View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.headerSub}>Live data from Firebase</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={[
                    styles.statsGrid,
                    desktop && styles.statsGridDesktop,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    {statCards.map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                                <Ionicons name={s.icon} size={20} color={s.color} />
                            </View>
                            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="flash" size={16} color={ADMIN_ACCENT} /> Quick Actions
                    </Text>
                    <View style={[styles.actionsRow, desktop && styles.actionsRowDesktop]}>
                        {[
                            { label: 'Manage Users', icon: 'people', screen: '/(admin)/users' },
                            { label: 'View Rides', icon: 'navigate', screen: '/(admin)/rides' },
                            { label: 'Manage Fines', icon: 'cash', screen: '/(admin)/fines' },
                        ].map((a, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.actionCard}
                                onPress={() => router.push(a.screen)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={a.icon} size={22} color={ADMIN_ACCENT} />
                                <Text style={styles.actionLabel}>{a.label}</Text>
                                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="time" size={16} color={ADMIN_ACCENT} /> Recent Rides
                    </Text>
                    {!stats?.recentRides?.length ? (
                        <Text style={styles.emptyText}>No ride sessions in Firebase yet.</Text>
                    ) : (
                        stats.recentRides.map((r) => (
                            <View key={`${r.rfidUid}-${r.sessionId}`} style={styles.rideRow}>
                                <View style={styles.rideIcon}>
                                    <Ionicons name="bicycle" size={16} color={COLORS.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rideBikeId}>{r.sessionId}</Text>
                                    <Text style={styles.rideRoute}>RFID: {r.rfidUid}</Text>
                                    <Text style={styles.rideTime}>{formatSessionTime(r.startTime)}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.rideDuration}>
                                        {r.durationMinutes != null ? `${r.durationMinutes} min` : r.endTime ? '—' : 'active'}
                                    </Text>
                                    {(r.durationMinutes ?? 0) > 20 && (
                                        <View style={[styles.fineBadge, { backgroundColor: COLORS.warningGlow }]}>
                                            <Text style={[styles.fineBadgeText, { color: COLORS.warning }]}>Overtime</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: SIZES.paddingXL, paddingTop: Platform.select({ web: 24, default: 56 }) },
    scrollDesktop: { maxWidth: 1100, alignSelf: 'center', width: '100%', paddingTop: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
    adminBadgeRow: { flexDirection: 'row', marginBottom: 8 },
    adminBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: ADMIN_GLOW, paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
    },
    adminBadgeText: { fontSize: 10, color: '#F59E0B', ...FONTS.bold, letterSpacing: 1 },
    headerTitle: { fontSize: 32, color: COLORS.textPrimary, ...FONTS.bold },
    headerSub: { fontSize: 15, color: COLORS.textMuted, marginTop: 4 },
    logoutBtn: {
        padding: 12, borderRadius: 14, backgroundColor: COLORS.dangerGlow,
        borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 32 },
    statsGridDesktop: { gap: 16 },
    statCard: {
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 20,
        borderWidth: 1, borderColor: COLORS.border, width: '47%',
        minWidth: 150, flexGrow: 1, minHeight: 130,
    },
    statIconWrap: {
        width: 42, height: 42, borderRadius: 12, justifyContent: 'center',
        alignItems: 'center', marginBottom: 12,
    },
    statValue: { fontSize: 28, ...FONTS.bold, marginBottom: 4 },
    statLabel: { fontSize: 13, color: COLORS.textMuted, ...FONTS.medium },
    sectionTitle: { fontSize: 18, color: COLORS.textPrimary, ...FONTS.semibold, marginBottom: 16 },
    actionsRow: { gap: 12, marginBottom: 32 },
    actionsRowDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
    actionCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 18,
        borderWidth: 1, borderColor: COLORS.border, flex: 1, minWidth: 200,
    },
    actionLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary, ...FONTS.medium },
    emptyText: { color: COLORS.textMuted, fontSize: 14, marginBottom: 16 },
    rideRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 16,
        borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
    },
    rideIcon: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center', alignItems: 'center',
    },
    rideBikeId: { fontSize: 15, color: COLORS.textPrimary, ...FONTS.semibold },
    rideRoute: { fontSize: 13, color: COLORS.textMuted },
    rideTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    rideDuration: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
    fineBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 3 },
    fineBadgeText: { fontSize: 12, ...FONTS.semibold },
});
