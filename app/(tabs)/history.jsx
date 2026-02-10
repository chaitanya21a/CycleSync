import React, { useState, useRef, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { RIDE_HISTORY } from '../../constants/mockData';

const FINE_REASONS = {
    wrong_parking: { label: 'Wrong Parking', icon: 'location-outline', color: COLORS.danger },
    overtime: { label: 'Overtime', icon: 'timer-outline', color: COLORS.warning },
    damage: { label: 'Damage', icon: 'construct-outline', color: COLORS.danger },
    out_of_campus: { label: 'Out of Campus', icon: 'globe-outline', color: COLORS.danger },
};

function RideCard({ ride, index }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 80, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, delay: index * 80, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();
    }, []);

    const startDate = new Date(ride.startTime);
    const formatDate = (date) => {
        const today = new Date();
        const diff = Math.floor((today - date) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const formatTime = (date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const fineInfo = ride.fine ? FINE_REASONS[ride.fine.reason] : null;

    return (
        <Animated.View style={[styles.rideCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.rideHeader}>
                <View style={styles.rideIdRow}>
                    <View style={styles.rideIconContainer}>
                        <Ionicons name="bicycle" size={18} color={COLORS.primary} />
                    </View>
                    <View>
                        <Text style={styles.rideId}>{ride.bicycleId}</Text>
                        <View style={styles.rideDateRow}>
                            <Ionicons name="calendar-outline" size={10} color={COLORS.textMuted} />
                            <Text style={styles.rideDate}>{formatDate(startDate)} at {formatTime(startDate)}</Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.durationBadge, ride.duration > 20 && styles.durationBadgeWarning]}>
                    <Ionicons name="time-outline" size={13} color={ride.duration > 20 ? COLORS.warning : COLORS.textSecondary} />
                    <Text style={[styles.durationText, ride.duration > 20 && { color: COLORS.warning }]}>{ride.duration} min</Text>
                </View>
            </View>

            <View style={styles.routeContainer}>
                <View style={styles.routeTimeline}>
                    <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
                    <View style={styles.routeLine} />
                    <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
                </View>
                <View style={styles.routeLabels}>
                    <View style={styles.routeRow}>
                        <Ionicons name="ellipse" size={6} color={COLORS.success} />
                        <Text style={styles.routeText}>{ride.startLocation}</Text>
                    </View>
                    <View style={styles.routeRow}>
                        <Ionicons name="flag" size={6} color={COLORS.primary} />
                        <Text style={styles.routeText}>{ride.endLocation}</Text>
                    </View>
                </View>
            </View>

            {ride.fine && fineInfo && (
                <View style={styles.fineContainer}>
                    <View style={styles.fineLeft}>
                        <View style={[styles.fineIconBg, { backgroundColor: fineInfo.color + '18' }]}>
                            <Ionicons name={fineInfo.icon} size={16} color={fineInfo.color} />
                        </View>
                        <View>
                            <Text style={[styles.fineReason, { color: fineInfo.color }]}>{fineInfo.label}</Text>
                            <Text style={styles.fineAmount}>₹{ride.fine.amount}</Text>
                        </View>
                    </View>
                    <View style={[styles.fineStatusBadge, ride.fine.status === 'paid' ? styles.fineStatusPaid : styles.fineStatusPending]}>
                        <Ionicons name={ride.fine.status === 'paid' ? 'checkmark-circle' : 'alert-circle'} size={12} color={ride.fine.status === 'paid' ? COLORS.success : COLORS.warning} />
                        <Text style={[styles.fineStatusText, { color: ride.fine.status === 'paid' ? COLORS.success : COLORS.warning }]}>
                            {ride.fine.status === 'paid' ? 'Paid' : 'Pending'}
                        </Text>
                    </View>
                </View>
            )}
        </Animated.View>
    );
}

export default function HistoryScreen() {
    const { width } = useWindowDimensions();
    const [filter, setFilter] = useState('all');
    const desktop = width >= 1024;

    const filters = [
        { id: 'all', label: 'All Rides', icon: 'list-outline' },
        { id: 'fines', label: 'With Fines', icon: 'alert-circle-outline' },
        { id: 'clean', label: 'No Fines', icon: 'checkmark-circle-outline' },
    ];

    const filteredRides = RIDE_HISTORY.filter((ride) => {
        if (filter === 'fines') return ride.fine !== null;
        if (filter === 'clean') return ride.fine === null;
        return true;
    });

    const totalFines = RIDE_HISTORY.reduce((sum, r) => sum + (r.fine ? r.fine.amount : 0), 0);
    const pendingFines = RIDE_HISTORY.reduce((sum, r) => sum + (r.fine && r.fine.status === 'pending' ? r.fine.amount : 0), 0);
    const paidFines = totalFines - pendingFines;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, desktop && styles.scrollContentDesktop]}>
                <View style={desktop && styles.desktopContainer}>
                    <View style={styles.header}>
                        <View style={styles.headerIconBg}>
                            <Ionicons name="time" size={22} color={COLORS.secondary} />
                        </View>
                        <View>
                            <Text style={[styles.title, desktop && { fontSize: 28 }]}>Ride History</Text>
                            <Text style={styles.subtitle}>Your past rides, fines, and violations</Text>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.histStatCard}>
                            <View style={[styles.statIconSmall, { backgroundColor: COLORS.primaryGlow }]}>
                                <Ionicons name="bicycle" size={18} color={COLORS.primary} />
                            </View>
                            <Text style={styles.histStatValue}>{RIDE_HISTORY.length}</Text>
                            <Text style={styles.histStatLabel}>Total Rides</Text>
                        </View>
                        <View style={styles.histStatCard}>
                            <View style={[styles.statIconSmall, { backgroundColor: COLORS.warningGlow }]}>
                                <Ionicons name="receipt" size={18} color={COLORS.warning} />
                            </View>
                            <Text style={styles.histStatValue}>₹{totalFines}</Text>
                            <Text style={styles.histStatLabel}>Total Fines</Text>
                        </View>
                        <View style={styles.histStatCard}>
                            <View style={[styles.statIconSmall, { backgroundColor: COLORS.dangerGlow }]}>
                                <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                            </View>
                            <Text style={styles.histStatValue}>₹{pendingFines}</Text>
                            <Text style={styles.histStatLabel}>Pending</Text>
                        </View>
                        <View style={styles.histStatCard}>
                            <View style={[styles.statIconSmall, { backgroundColor: COLORS.successGlow }]}>
                                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                            </View>
                            <Text style={styles.histStatValue}>₹{paidFines}</Text>
                            <Text style={styles.histStatLabel}>Paid</Text>
                        </View>
                    </View>

                    {/* Filters */}
                    <View style={styles.filterRow}>
                        {filters.map((f) => (
                            <TouchableOpacity
                                key={f.id}
                                style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
                                onPress={() => setFilter(f.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={f.icon} size={14} color={filter === f.id ? COLORS.primary : COLORS.textMuted} />
                                <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Rides - grid on desktop */}
                    <View style={desktop && styles.ridesGrid}>
                        {filteredRides.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconBg}>
                                    <Ionicons name="document-text-outline" size={40} color={COLORS.textMuted} />
                                </View>
                                <Text style={styles.emptyTitle}>No rides found</Text>
                                <Text style={styles.emptySubtext}>
                                    {filter === 'fines' ? 'Great! No fines to show.' : 'Start riding to build your history.'}
                                </Text>
                            </View>
                        ) : (
                            filteredRides.map((ride, index) => (
                                <View key={ride.id} style={desktop && { width: '48%' }}>
                                    <RideCard ride={ride} index={index} />
                                </View>
                            ))
                        )}
                    </View>

                    <View style={{ height: 24 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
    scrollContent: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 100 },
    scrollContentDesktop: { paddingHorizontal: 40 },
    desktopContainer: { maxWidth: 960, alignSelf: 'center', width: '100%' },

    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
    headerIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.secondaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
    title: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold },
    subtitle: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.regular, marginTop: 2 },

    // Stats
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    histStatCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radius, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 6 },
    statIconSmall: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    histStatValue: { fontSize: SIZES.base, color: COLORS.textPrimary, ...FONTS.bold },
    histStatLabel: { fontSize: 10, color: COLORS.textSecondary, ...FONTS.regular },

    // Filters
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
    filterChipActive: { borderColor: COLORS.borderAccent, backgroundColor: COLORS.primaryGlow },
    filterChipText: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.medium },
    filterChipTextActive: { color: COLORS.primary },

    // Rides Grid
    ridesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },

    // Ride Card
    rideCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...(Platform.OS === 'web' ? { transition: 'transform 0.15s' } : {}) },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    rideIdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rideIconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryGlow, justifyContent: 'center', alignItems: 'center' },
    rideId: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.semibold },
    rideDateRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    rideDate: { fontSize: SIZES.xs, color: COLORS.textMuted, ...FONTS.regular },
    durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.bgInput },
    durationBadgeWarning: { backgroundColor: COLORS.warningGlow },
    durationText: { fontSize: SIZES.xs, color: COLORS.textSecondary, ...FONTS.medium },

    // Route
    routeContainer: { flexDirection: 'row', gap: 10, marginBottom: 4 },
    routeTimeline: { alignItems: 'center', paddingVertical: 2 },
    routeDot: { width: 8, height: 8, borderRadius: 4 },
    routeLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 3 },
    routeLabels: { flex: 1, justifyContent: 'space-between' },
    routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    routeText: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.regular },

    // Fine
    fineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    fineLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fineIconBg: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    fineReason: { fontSize: SIZES.sm, ...FONTS.semibold },
    fineAmount: { fontSize: SIZES.xs, color: COLORS.textSecondary, ...FONTS.regular },
    fineStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, borderWidth: 1 },
    fineStatusPaid: { backgroundColor: COLORS.successGlow, borderColor: 'rgba(16,185,129,0.3)' },
    fineStatusPending: { backgroundColor: COLORS.warningGlow, borderColor: 'rgba(245,158,11,0.3)' },
    fineStatusText: { fontSize: SIZES.xs, ...FONTS.semibold },

    // Empty
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, width: '100%' },
    emptyIconBg: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    emptyTitle: { fontSize: SIZES.lg, color: COLORS.textSecondary, ...FONTS.semibold },
    emptySubtext: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.regular },
});
