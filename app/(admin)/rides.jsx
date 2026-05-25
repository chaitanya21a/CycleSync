import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { getAllRideSessions } from '../../services/firebaseService';

const ADMIN_ACCENT = '#F59E0B';

const STATUS_COLORS = {
    completed: COLORS.success,
    active: '#3B82F6',
};

function parseTime(t) {
    if (!t) return null;
    if (typeof t === 'string' && t.includes(' ')) {
        return new Date(t.replace(' ', 'T'));
    }
    return new Date(t);
}

export default function AdminRides() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [filter, setFilter] = useState('all');
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        (async () => {
            try {
                const sessions = await getAllRideSessions();
                const mapped = sessions.map((s) => ({
                    id: `${s.rfidUid}-${s.sessionId}`,
                    rfidUid: s.rfidUid,
                    sessionId: s.sessionId,
                    startTime: s.startTime,
                    endTime: s.endTime || null,
                    duration: s.durationMinutes ?? 0,
                    status: s.endTime ? 'completed' : 'active',
                }));
                setRides(mapped);
            } catch {
                setRides([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'completed', label: 'Completed' },
    ];

    const filtered = rides.filter((r) => filter === 'all' || r.status === filter);

    const formatTime = (t) => {
        const d = parseTime(t);
        if (!d || Number.isNaN(d.getTime())) return '—';
        return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

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
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            <Ionicons name="navigate" size={22} color={ADMIN_ACCENT} /> Rides
                        </Text>
                        <Text style={styles.headerSub}>{rides.length} total sessions</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { borderLeftColor: '#3B82F6' }]}>
                            <Ionicons name="play-circle" size={18} color="#3B82F6" />
                            <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                                {rides.filter((r) => r.status === 'active').length}
                            </Text>
                            <Text style={styles.summaryLabel}>Active</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                                {rides.filter((r) => r.status === 'completed').length}
                            </Text>
                            <Text style={styles.summaryLabel}>Completed</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.warning }]}>
                            <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
                            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                                {rides.filter((r) => r.duration > 20).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Overtime</Text>
                        </View>
                    </View>

                    <View style={styles.filterRow}>
                        {filters.map((f) => (
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

                    {filtered.length === 0 ? (
                        <Text style={styles.emptyText}>No ride sessions found.</Text>
                    ) : (
                        <View style={[styles.grid, desktop && styles.gridDesktop]}>
                            {filtered.map((r) => (
                                <View key={r.id} style={styles.rideCard}>
                                    <View style={styles.rideHeader}>
                                        <View style={styles.rideIdRow}>
                                            <View style={[styles.rideIcon, { backgroundColor: `${STATUS_COLORS[r.status]}15` }]}>
                                                <Ionicons name="bicycle" size={16} color={STATUS_COLORS[r.status]} />
                                            </View>
                                            <View>
                                                <Text style={styles.rideBikeId}>{r.sessionId}</Text>
                                                <Text style={styles.rideRider}>RFID: {r.rfidUid}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[r.status]}20` }]}>
                                            <Text style={[styles.statusText, { color: STATUS_COLORS[r.status] }]}>
                                                {r.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.rideTimes}>
                                        <View style={styles.timeRow}>
                                            <Ionicons name="play-outline" size={13} color={COLORS.success} />
                                            <Text style={styles.timeText}>Start: {formatTime(r.startTime)}</Text>
                                        </View>
                                        <View style={styles.timeRow}>
                                            <Ionicons name="stop-outline" size={13} color={COLORS.danger} />
                                            <Text style={styles.timeText}>
                                                End: {r.endTime ? formatTime(r.endTime) : 'In progress...'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.rideFooter}>
                                        <Text style={[styles.rideDuration, r.duration > 20 && { color: COLORS.warning }]}>
                                            {r.duration > 0 ? `${r.duration} min` : 'ongoing'}
                                        </Text>
                                        {r.duration > 20 && (
                                            <View style={styles.fineBadge}>
                                                <Text style={styles.fineBadgeText}>Overtime</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
    centered: { justifyContent: 'center', alignItems: 'center' },
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
    emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginTop: 24 },
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
    rideTimes: { gap: 6, marginBottom: 12 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    timeText: { fontSize: 12, color: COLORS.textSecondary },
    rideFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    rideDuration: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.semibold },
    fineBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: COLORS.warningGlow },
    fineBadgeText: { fontSize: 11, color: COLORS.warning, ...FONTS.semibold },
});
