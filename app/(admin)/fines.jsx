import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const ADMIN_ACCENT = '#F59E0B';

const STATUS_COLORS = { pending: COLORS.warning, paid: COLORS.success, waived: '#7C3AED' };
const REASON_ICONS = { overtime: 'time', wrong_parking: 'location-outline', damage: 'alert-circle', out_of_campus: 'navigate' };

const MOCK_FINES = [
    { id: 'F-001', user: 'Tanya Sharma', email: 'tanya@college.edu', bicycleId: 'CYCLE-045', reason: 'overtime', amount: 50, status: 'pending', date: '2026-02-09T14:40:00' },
    { id: 'F-002', user: 'Rahul Verma', email: 'rahul@college.edu', bicycleId: 'CYCLE-034', reason: 'overtime', amount: 50, status: 'pending', date: '2026-02-10T10:25:00' },
    { id: 'F-003', user: 'Vikram Patel', email: 'vikram@college.edu', bicycleId: 'CYCLE-089', reason: 'wrong_parking', amount: 100, status: 'pending', date: '2026-02-09T15:35:00' },
    { id: 'F-004', user: 'Amit Kumar', email: 'amit@college.edu', bicycleId: 'CYCLE-078', reason: 'wrong_parking', amount: 100, status: 'paid', date: '2026-02-07T16:22:00' },
    { id: 'F-005', user: 'Anjali Reddy', email: 'anjali@college.edu', bicycleId: 'CYCLE-012', reason: 'overtime', amount: 50, status: 'waived', date: '2026-02-06T12:15:00' },
    { id: 'F-006', user: 'Rahul Verma', email: 'rahul@college.edu', bicycleId: 'CYCLE-056', reason: 'damage', amount: 200, status: 'pending', date: '2026-02-05T09:30:00' },
    { id: 'F-007', user: 'Sneha Gupta', email: 'sneha@college.edu', bicycleId: 'CYCLE-023', reason: 'overtime', amount: 50, status: 'paid', date: '2026-02-04T11:00:00' },
];

export default function AdminFines() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [filter, setFilter] = useState('all');
    const [fines, setFines] = useState(MOCK_FINES);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const filters = [
        { key: 'all', label: 'All', count: fines.length },
        { key: 'pending', label: 'Pending', count: fines.filter(f => f.status === 'pending').length },
        { key: 'paid', label: 'Paid', count: fines.filter(f => f.status === 'paid').length },
        { key: 'waived', label: 'Waived', count: fines.filter(f => f.status === 'waived').length },
    ];

    const totalPending = fines.filter(f => f.status === 'pending').reduce((t, f) => t + f.amount, 0);
    const totalCollected = fines.filter(f => f.status === 'paid').reduce((t, f) => t + f.amount, 0);
    const totalWaived = fines.filter(f => f.status === 'waived').reduce((t, f) => t + f.amount, 0);

    const filtered = fines.filter(f => filter === 'all' || f.status === filter);

    const handleWaive = (fineId) => {
        setFines(prev => prev.map(f => f.id === fineId ? { ...f, status: 'waived' } : f));
    };

    const formatDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            <Ionicons name="cash" size={22} color={ADMIN_ACCENT} /> Fines
                        </Text>
                        <Text style={styles.headerSub}>{fines.length} total fines recorded</Text>
                    </View>

                    {/* Revenue Summary */}
                    <View style={styles.revenueRow}>
                        <View style={[styles.revenueCard, { borderLeftColor: COLORS.warning }]}>
                            <Text style={styles.revenueTitle}>Pending</Text>
                            <Text style={[styles.revenueAmount, { color: COLORS.warning }]}>₹{totalPending}</Text>
                        </View>
                        <View style={[styles.revenueCard, { borderLeftColor: COLORS.success }]}>
                            <Text style={styles.revenueTitle}>Collected</Text>
                            <Text style={[styles.revenueAmount, { color: COLORS.success }]}>₹{totalCollected}</Text>
                        </View>
                        <View style={[styles.revenueCard, { borderLeftColor: '#7C3AED' }]}>
                            <Text style={styles.revenueTitle}>Waived</Text>
                            <Text style={[styles.revenueAmount, { color: '#7C3AED' }]}>₹{totalWaived}</Text>
                        </View>
                    </View>

                    {/* Filters */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        {filters.map(f => (
                            <TouchableOpacity
                                key={f.key}
                                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                                onPress={() => setFilter(f.key)}
                            >
                                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
                                <View style={[styles.filterCount, filter === f.key && styles.filterCountActive]}>
                                    <Text style={[styles.filterCountText, filter === f.key && styles.filterCountTextActive]}>{f.count}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Fine Cards */}
                    <View style={[styles.grid, desktop && styles.gridDesktop]}>
                        {filtered.map((f) => (
                            <View key={f.id} style={styles.fineCard}>
                                <View style={styles.fineHeader}>
                                    <View style={styles.fineUserRow}>
                                        <View style={[styles.reasonIcon, { backgroundColor: `${STATUS_COLORS[f.status]}15` }]}>
                                            <Ionicons name={REASON_ICONS[f.reason] || 'alert-circle'} size={16} color={STATUS_COLORS[f.status]} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fineUser}>{f.user}</Text>
                                            <Text style={styles.fineEmail}>{f.email}</Text>
                                        </View>
                                        <Text style={[styles.fineAmount, { color: STATUS_COLORS[f.status] }]}>₹{f.amount}</Text>
                                    </View>
                                </View>

                                <View style={styles.fineDetails}>
                                    <View style={styles.fineDetail}>
                                        <Ionicons name="bicycle-outline" size={13} color={COLORS.textMuted} />
                                        <Text style={styles.fineDetailText}>{f.bicycleId}</Text>
                                    </View>
                                    <View style={styles.fineDetail}>
                                        <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} />
                                        <Text style={styles.fineDetailText}>{f.reason.replace('_', ' ')}</Text>
                                    </View>
                                    <View style={styles.fineDetail}>
                                        <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                                        <Text style={styles.fineDetailText}>{formatDate(f.date)}</Text>
                                    </View>
                                </View>

                                <View style={styles.fineFooter}>
                                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[f.status]}20` }]}>
                                        <Text style={[styles.statusText, { color: STATUS_COLORS[f.status] }]}>
                                            {f.status}
                                        </Text>
                                    </View>
                                    {f.status === 'pending' && (
                                        <TouchableOpacity style={styles.waiveBtn} onPress={() => handleWaive(f.id)}>
                                            <Ionicons name="close-circle-outline" size={14} color="#7C3AED" />
                                            <Text style={styles.waiveBtnText}>Waive</Text>
                                        </TouchableOpacity>
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
    revenueRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    revenueCard: {
        flex: 1, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusSM, padding: 14,
        borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3,
    },
    revenueTitle: { fontSize: 11, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 4 },
    revenueAmount: { fontSize: 20, ...FONTS.bold },
    filterScroll: { marginBottom: 20, flexDirection: 'row' },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, marginRight: 8,
    },
    filterChipActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
    filterText: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium },
    filterTextActive: { color: ADMIN_ACCENT },
    filterCount: { backgroundColor: COLORS.bgSecondary, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10 },
    filterCountActive: { backgroundColor: 'rgba(245,158,11,0.25)' },
    filterCountText: { fontSize: 11, color: COLORS.textMuted, ...FONTS.semibold },
    filterCountTextActive: { color: ADMIN_ACCENT },
    grid: { gap: 10 },
    gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    fineCard: {
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radius, padding: 16,
        borderWidth: 1, borderColor: COLORS.border,
        ...(Platform.OS === 'web' ? { flexBasis: '48%', minWidth: 340 } : {}),
    },
    fineHeader: { marginBottom: 12 },
    fineUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reasonIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    fineUser: { fontSize: 14, color: COLORS.textPrimary, ...FONTS.semibold },
    fineEmail: { fontSize: 11, color: COLORS.textMuted },
    fineAmount: { fontSize: 18, ...FONTS.bold },
    fineDetails: { gap: 6, marginBottom: 12 },
    fineDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    fineDetailText: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
    fineFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10,
    },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    statusText: { fontSize: 11, ...FONTS.semibold, textTransform: 'capitalize' },
    waiveBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
        backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
    },
    waiveBtnText: { fontSize: 12, color: '#7C3AED', ...FONTS.semibold },
});
