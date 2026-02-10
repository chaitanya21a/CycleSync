import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { BICYCLES, PARKING_SPOTS, RIDE_HISTORY, STATS } from '../../constants/mockData';

const ADMIN_ACCENT = '#F59E0B';
const ADMIN_GLOW = 'rgba(245, 158, 11, 0.15)';

export default function AdminOverview() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const stats = [
        { label: 'Total Bicycles', value: STATS.totalBikes, icon: 'bicycle', color: COLORS.primary, bg: COLORS.primaryGlow },
        { label: 'Available', value: STATS.availableBikes, icon: 'checkmark-circle', color: COLORS.success, bg: COLORS.successGlow },
        { label: 'In Use', value: STATS.inUseBikes, icon: 'person', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
        { label: 'Maintenance', value: STATS.maintenanceBikes, icon: 'construct', color: COLORS.warning, bg: COLORS.warningGlow },
        { label: 'Total Users', value: 156, icon: 'people', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)' },
        { label: "Today's Rides", value: STATS.todayRides, icon: 'trending-up', color: COLORS.primary, bg: COLORS.primaryGlow },
        { label: 'Pending Fines', value: '₹2,450', icon: 'alert-circle', color: COLORS.warning, bg: COLORS.warningGlow },
        { label: 'Banned Users', value: 3, icon: 'ban', color: COLORS.danger, bg: COLORS.dangerGlow },
    ];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();
    }, []);

    const recentRides = RIDE_HISTORY.slice(0, 5);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View>
                        <View style={styles.adminBadgeRow}>
                            <View style={styles.adminBadge}>
                                <Ionicons name="shield-checkmark" size={12} color={ADMIN_ACCENT} />
                                <Text style={styles.adminBadgeText}>ADMIN</Text>
                            </View>
                        </View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.headerSub}>Fleet overview & management</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/(auth)/login')}>
                        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Stats Grid */}
                <Animated.View style={[
                    styles.statsGrid,
                    desktop && styles.statsGridDesktop,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}>
                    {stats.map((s, i) => (
                        <View key={i} style={styles.statCard}>
                            <View style={[styles.statIconWrap, { backgroundColor: s.bg }]}>
                                <Ionicons name={s.icon} size={20} color={s.color} />
                            </View>
                            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Quick Actions */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="flash" size={16} color={ADMIN_ACCENT} /> Quick Actions
                    </Text>
                    <View style={[styles.actionsRow, desktop && styles.actionsRowDesktop]}>
                        {[
                            { label: 'View All Bikes', icon: 'bicycle', screen: '/(admin)/bicycles' },
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

                {/* Recent Rides */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="time" size={16} color={ADMIN_ACCENT} /> Recent Rides
                    </Text>
                    {recentRides.map((r, i) => (
                        <View key={i} style={styles.rideRow}>
                            <View style={styles.rideIcon}>
                                <Ionicons name="bicycle" size={16} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rideBikeId}>{r.bicycleId}</Text>
                                <Text style={styles.rideRoute}>{r.startLocation} → {r.endLocation}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.rideDuration}>{r.duration} min</Text>
                                {r.fine && (
                                    <View style={[styles.fineBadge, { backgroundColor: r.fine.status === 'paid' ? COLORS.successGlow : COLORS.warningGlow }]}>
                                        <Text style={[styles.fineBadgeText, { color: r.fine.status === 'paid' ? COLORS.success : COLORS.warning }]}>
                                            ₹{r.fine.amount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
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
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 32,
    },
    statsGridDesktop: { gap: 16 },
    statCard: {
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 20,
        borderWidth: 1, borderColor: COLORS.border, width: '47%',
        minWidth: 150, flexGrow: 1, minHeight: 130,
        ...(Platform.OS === 'web' ? { transition: 'transform 0.2s' } : {}),
    },
    statIconWrap: {
        width: 42, height: 42, borderRadius: 12, justifyContent: 'center',
        alignItems: 'center', marginBottom: 12,
    },
    statValue: { fontSize: 28, ...FONTS.bold, marginBottom: 4 },
    statLabel: { fontSize: 13, color: COLORS.textMuted, ...FONTS.medium },
    sectionTitle: {
        fontSize: 18, color: COLORS.textPrimary, ...FONTS.semibold, marginBottom: 16,
    },
    actionsRow: { gap: 12, marginBottom: 32 },
    actionsRowDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
    actionCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 18,
        borderWidth: 1, borderColor: COLORS.border, flex: 1, minWidth: 200,
    },
    actionLabel: { flex: 1, fontSize: 15, color: COLORS.textPrimary, ...FONTS.medium },
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
    rideDuration: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.medium },
    fineBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 3 },
    fineBadgeText: { fontSize: 12, ...FONTS.semibold },
});
