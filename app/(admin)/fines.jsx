import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { getAllStudents, clearStudentFine } from '../../services/firebaseService';

const ADMIN_ACCENT = '#F59E0B';
const OVERTIME_FINE_AMOUNT = 50;

export default function AdminFines() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clearingRfid, setClearingRfid] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const loadFines = async () => {
        try {
            const students = await getAllStudents();
            const withFines = students
                .filter((s) => s.hasFine)
                .map((s) => ({
                    id: s.rfidUid,
                    rfidUid: s.rfidUid,
                    user: s.name || 'Unknown',
                    email: s.email || '',
                    reason: 'overtime',
                    amount: OVERTIME_FINE_AMOUNT,
                    status: 'pending',
                    violationCount: s.violationCount ?? 0,
                }));
            setFines(withFines);
        } catch {
            Alert.alert('Error', 'Failed to load fines from Firebase.');
            setFines([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        loadFines();
    }, []);

    const totalPending = fines.reduce((t, f) => t + f.amount, 0);

    const handleWaive = async (fine) => {
        setClearingRfid(fine.rfidUid);
        try {
            await clearStudentFine(fine.rfidUid);
            setFines((prev) => prev.filter((f) => f.rfidUid !== fine.rfidUid));
            Alert.alert('Success', `Fine waived for ${fine.user}`);
        } catch {
            Alert.alert('Error', 'Failed to waive fine.');
        } finally {
            setClearingRfid(null);
        }
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
                            <Ionicons name="cash" size={22} color={ADMIN_ACCENT} /> Fines
                        </Text>
                        <Text style={styles.headerSub}>{fines.length} pending fines</Text>
                    </View>

                    <View style={styles.revenueRow}>
                        <View style={[styles.revenueCard, { borderLeftColor: COLORS.warning }]}>
                            <Text style={styles.revenueTitle}>Pending</Text>
                            <Text style={[styles.revenueAmount, { color: COLORS.warning }]}>₹{totalPending}</Text>
                        </View>
                        <View style={[styles.revenueCard, { borderLeftColor: COLORS.danger }]}>
                            <Text style={styles.revenueTitle}>Students</Text>
                            <Text style={[styles.revenueAmount, { color: COLORS.danger }]}>{fines.length}</Text>
                        </View>
                    </View>

                    {fines.length === 0 ? (
                        <Text style={styles.emptyText}>No pending fines.</Text>
                    ) : (
                        <View style={[styles.grid, desktop && styles.gridDesktop]}>
                            {fines.map((f) => (
                                <View key={f.id} style={styles.fineCard}>
                                    <View style={styles.fineHeader}>
                                        <View style={styles.fineUserRow}>
                                            <View style={[styles.reasonIcon, { backgroundColor: COLORS.warningGlow }]}>
                                                <Ionicons name="time" size={16} color={COLORS.warning} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.fineUser}>{f.user}</Text>
                                                <Text style={styles.fineEmail}>{f.email}</Text>
                                            </View>
                                            <Text style={[styles.fineAmount, { color: COLORS.warning }]}>₹{f.amount}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.fineDetails}>
                                        <View style={styles.fineDetail}>
                                            <Ionicons name="card-outline" size={13} color={COLORS.textMuted} />
                                            <Text style={styles.fineDetailText}>RFID: {f.rfidUid}</Text>
                                        </View>
                                        <View style={styles.fineDetail}>
                                            <Ionicons name="information-circle-outline" size={13} color={COLORS.textMuted} />
                                            <Text style={styles.fineDetailText}>Overtime (&gt;20 min)</Text>
                                        </View>
                                        <View style={styles.fineDetail}>
                                            <Ionicons name="alert-circle-outline" size={13} color={COLORS.textMuted} />
                                            <Text style={styles.fineDetailText}>{f.violationCount} violations</Text>
                                        </View>
                                    </View>

                                    <View style={styles.fineFooter}>
                                        <View style={[styles.statusBadge, { backgroundColor: COLORS.warningGlow }]}>
                                            <Text style={[styles.statusText, { color: COLORS.warning }]}>pending</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.waiveBtn}
                                            onPress={() => handleWaive(f)}
                                            disabled={clearingRfid === f.rfidUid}
                                        >
                                            <Ionicons name="close-circle-outline" size={14} color="#7C3AED" />
                                            <Text style={styles.waiveBtnText}>
                                                {clearingRfid === f.rfidUid ? 'Waiving...' : 'Waive'}
                                            </Text>
                                        </TouchableOpacity>
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
    revenueRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    revenueCard: {
        flex: 1, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusSM, padding: 14,
        borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3,
    },
    revenueTitle: { fontSize: 11, color: COLORS.textMuted, ...FONTS.medium, marginBottom: 4 },
    revenueAmount: { fontSize: 20, ...FONTS.bold },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 14, marginTop: 24 },
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
    fineDetailText: { fontSize: 12, color: COLORS.textSecondary },
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
