import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { RIDE_HISTORY } from '../../constants/mockData';

const ADMIN_ACCENT = '#F59E0B';

const STATUS_COLORS = {
    completed: COLORS.success,
    active: '#3B82F6',
    force_ended: COLORS.danger,
};

// Extended mock rides for admin
const ADMIN_RIDES = [
    ...RIDE_HISTORY,
    { id: 'R-006', bicycleId: 'CYCLE-034', startTime: '2026-02-10T10:00:00', endTime: '2026-02-10T10:25:00', duration: 25, startLocation: 'Sports Complex', endLocation: 'Admin Building', status: 'completed', fine: { reason: 'overtime', amount: 50, status: 'pending' }, rider: 'Rahul Verma' },
    { id: 'R-007', bicycleId: 'CYCLE-067', startTime: '2026-02-10T11:30:00', endTime: null, duration: 0, startLocation: 'Library Parking', endLocation: '', status: 'active', fine: null, rider: 'Sneha Gupta' },
    { id: 'R-008', bicycleId: 'CYCLE-089', startTime: '2026-02-09T15:00:00', endTime: '2026-02-09T15:35:00', duration: 35, startLocation: 'Cafeteria Stand', endLocation: 'Outside Area', status: 'completed', fine: { reason: 'wrong_parking', amount: 100, status: 'pending' }, rider: 'Vikram Patel' },
];

export default function AdminRides() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [filter, setFilter] = useState('all');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
    ];

    const filtered = ADMIN_RIDES.filter(r => filter === 'all' || r.status === filter);

    const formatTime = (t) => {
        if (!t) return '—';
        const d = new Date(t);
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            <Ionicons name="navigate" size={22} color={ADMIN_ACCENT} /> Rides
                        </Text>
                        <Text style={styles.headerSub}>{ADMIN_RIDES.length} total rides</Text>
                    </View>

                    {/* Summary */}
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { borderLeftColor: '#3B82F6' }]}>
                            <Ionicons name="play-circle" size={18} color="#3B82F6" />
                            <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                                {ADMIN_RIDES.filter(r => r.status === 'active').length}
                            </Text>
                            <Text style={styles.summaryLabel}>Active</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                                {ADMIN_RIDES.filter(r => r.status === 'completed').length}
                            </Text>
                            <Text style={styles.summaryLabel}>Completed</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.warning }]}>
                            <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
                            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                                {ADMIN_RIDES.filter(r => r.duration > 20).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Overtime</Text>
                        </View>
                    </View>

                    {/* Filters */}
                    <View style={styles.filterRow}>
                        {filters.map(f => (
                            <TouchableOpacity
                                key={f.key}
                                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                                onPress={() => setFilter(f.key)}
                            >
                                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Rides List */}
                    <View style={[styles.grid, desktop && styles.gridDesktop]}>
                        {filtered.map((r, i) => (
                            <View key={r.id} style={styles.rideCard}>
                                <View style={styles.rideHeader}>
                                    <View style={styles.rideIdRow}>
                                        <View style={[styles.rideIcon, { backgroundColor: `${STATUS_COLORS[r.status]}15` }]}>
                                            <Ionicons name="bicycle" size={16} color={STATUS_COLORS[r.status]} />
                                        </View>
                                        <View>
                                            <Text style={styles.rideBikeId}>{r.bicycleId}</Text>
                                            {r.rider && <Text style={styles.rideRider}>{r.rider}</Text>}
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[r.status]}20` }]}>
                                        <Text style={[styles.statusText, { color: STATUS_COLORS[r.status] }]}>
                                            {r.status.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rideRoute}>
                                    <View style={styles.routePoint}>
                                        <View style={[styles.routeDot, { backgroundColor: COLORS.success }]} />
                                        <Text style={styles.routeText}>{r.startLocation}</Text>
                                    </View>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <View style={[styles.routeDot, { backgroundColor: r.endLocation ? COLORS.danger : COLORS.textMuted }]} />
                                        <Text style={styles.routeText}>{r.endLocation || 'In progress...'}</Text>
                                    </View>
                                </View>

                                <View style={styles.rideFooter}>
                                    <View style={styles.rideTime}>
                                        <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                                        <Text style={styles.rideTimeText}>{formatTime(r.startTime)}</Text>
                                    </View>
                                    <Text style={[styles.rideDuration, r.duration > 20 && { color: COLORS.warning }]}>
                                        {r.duration > 0 ? `${r.duration} min` : 'ongoing'}
                                    </Text>
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
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
    scroll: { padding: SIZES.paddingXL },
    scrollDesktop: { maxWidth: 960, alignSelf: 'center', width: '100%' },
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
    headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    summaryCard: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusSM, padding: 14,
        borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3,
    },
    summaryValue: { fontSize: 20, ...FONTS.bold },
    summaryLabel: { fontSize: 11, color: COLORS.textMuted, ...FONTS.medium },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    },
    filterChipActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
    filterText: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium },
    filterTextActive: { color: ADMIN_ACCENT },
    grid: { gap: 10 },
    gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    rideCard: {
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radius, padding: 16,
        borderWidth: 1, borderColor: COLORS.border,
        ...(Platform.OS === 'web' ? { flexBasis: '48%', minWidth: 340 } : {}),
    },
    rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    rideIdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rideIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rideBikeId: { fontSize: 14, color: COLORS.textPrimary, ...FONTS.semibold },
    rideRider: { fontSize: 11, color: COLORS.textMuted },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    statusText: { fontSize: 11, ...FONTS.semibold, textTransform: 'capitalize' },
    rideRoute: { marginBottom: 12, paddingLeft: 4 },
    routePoint: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeDot: { width: 8, height: 8, borderRadius: 4 },
    routeText: { fontSize: 12, color: COLORS.textSecondary },
    routeLine: { width: 2, height: 12, backgroundColor: COLORS.border, marginLeft: 3 },
    rideFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    rideTime: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    rideTimeText: { fontSize: 11, color: COLORS.textMuted },
    rideDuration: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.semibold },
    fineBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    fineBadgeText: { fontSize: 11, ...FONTS.semibold },
});
