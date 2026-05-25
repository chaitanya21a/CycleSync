import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, TextInput, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import {
    getAllStudents,
    banStudent,
    unbanStudent,
    clearStudentFine,
    assignRfidToStudent,
} from '../../services/firebaseService';

const ADMIN_ACCENT = '#F59E0B';

export default function AdminUsers() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rfidInputs, setRfidInputs] = useState({});
    const [savingRfidFor, setSavingRfidFor] = useState(null);
    const [actionRfid, setActionRfid] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const loadUsers = async () => {
        try {
            const students = await getAllStudents();
            setUsers(students);
        } catch (error) {
            Alert.alert('Error', 'Failed to load students from Firebase.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        loadUsers();
    }, []);

    const filtered = users.filter((u) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.studentId || '').toLowerCase().includes(q) ||
            (u.rfidUid || '').toLowerCase().includes(q)
        );
    });

    const updateUser = (rfidUid, patch) => {
        setUsers((prev) => prev.map((u) => (u.rfidUid === rfidUid ? { ...u, ...patch } : u)));
    };

    const handleBan = async (user) => {
        setActionRfid(user.rfidUid);
        try {
            if (user.isBanned) {
                await unbanStudent(user.rfidUid);
                updateUser(user.rfidUid, { isBanned: false, isAllowed: true });
            } else {
                await banStudent(user.rfidUid);
                updateUser(user.rfidUid, { isBanned: true, isAllowed: false });
            }
        } catch {
            Alert.alert('Error', 'Failed to update ban status.');
        } finally {
            setActionRfid(null);
        }
    };

    const handleClearFine = async (user) => {
        setActionRfid(user.rfidUid);
        try {
            await clearStudentFine(user.rfidUid);
            updateUser(user.rfidUid, { hasFine: false });
            Alert.alert('Success', `Fine cleared for ${user.name}`);
        } catch {
            Alert.alert('Error', 'Failed to clear fine.');
        } finally {
            setActionRfid(null);
        }
    };

    const handleAssignRfid = async (user) => {
        const tagUid = String(rfidInputs[user.rfidUid] || '').trim().toUpperCase();
        if (!tagUid) {
            Alert.alert('Missing RFID UID', 'Enter RFID UID before assigning.');
            return;
        }

        setSavingRfidFor(user.rfidUid);
        try {
            const { rfidUid: oldKey, ...studentData } = user;
            await assignRfidToStudent(oldKey, tagUid, studentData);
            setUsers((prev) =>
                prev.map((u) =>
                    u.rfidUid === oldKey ? { ...studentData, rfidUid: tagUid } : u
                )
            );
            setRfidInputs((prev) => ({ ...prev, [oldKey]: '', [tagUid]: '' }));
            Alert.alert('Success', `RFID assigned to ${user.name}`);
        } catch {
            Alert.alert('Error', 'Failed to assign RFID.');
        } finally {
            setSavingRfidFor(null);
        }
    };

    const finesCount = users.filter((u) => u.hasFine).length;

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
                            <Ionicons name="people" size={22} color={ADMIN_ACCENT} /> Users
                        </Text>
                        <Text style={styles.headerSub}>{users.length} registered students</Text>
                    </View>

                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={16} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, email, or student ID..."
                            placeholderTextColor={COLORS.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
                            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                                {users.filter((u) => !u.isBanned).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Active</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
                            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                                {users.filter((u) => u.isBanned).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Banned</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.warning }]}>
                            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                                {finesCount}
                            </Text>
                            <Text style={styles.summaryLabel}>With Fines</Text>
                        </View>
                    </View>

                    <View style={[styles.grid, desktop && styles.gridDesktop]}>
                        {filtered.map((u) => (
                            <View key={u.rfidUid} style={[styles.userCard, u.isBanned && styles.userCardBanned]}>
                                <View style={styles.userHeader}>
                                    <View style={styles.avatarWrap}>
                                        <Text style={styles.avatarText}>{(u.name || '?').charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.userName}>{u.name || 'Unknown'}</Text>
                                            {u.isBanned && (
                                                <View style={styles.bannedBadge}>
                                                    <Ionicons name="ban" size={10} color={COLORS.danger} />
                                                    <Text style={styles.bannedText}>BANNED</Text>
                                                </View>
                                            )}
                                            {u.hasFine && (
                                                <View style={[styles.bannedBadge, { backgroundColor: COLORS.warningGlow }]}>
                                                    <Text style={[styles.bannedText, { color: COLORS.warning }]}>FINE</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.userEmail}>{u.email}</Text>
                                        <Text style={styles.userStudentId}>{u.studentId || u.rfidUid}</Text>
                                    </View>
                                </View>

                                <View style={styles.userStats}>
                                    <View style={styles.userStat}>
                                        <Ionicons name="bicycle-outline" size={14} color={COLORS.primary} />
                                        <Text style={styles.userStatValue}>{u.totalRides ?? 0}</Text>
                                        <Text style={styles.userStatLabel}>rides</Text>
                                    </View>
                                    <View style={styles.userStat}>
                                        <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                                        <Text style={styles.userStatValue}>{u.violationCount ?? 0}</Text>
                                        <Text style={styles.userStatLabel}>violations</Text>
                                    </View>
                                    <View style={styles.userStat}>
                                        <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                                        <Text style={styles.userStatValue}>{u.dailyUsage?.minutes ?? 0}</Text>
                                        <Text style={styles.userStatLabel}>min today</Text>
                                    </View>
                                </View>

                                <View style={styles.rfidRow}>
                                    <View style={styles.rfidInputWrap}>
                                        <Ionicons name="card-outline" size={14} color={COLORS.textMuted} />
                                        <TextInput
                                            style={styles.rfidInput}
                                            placeholder={u.rfidUid || 'RFID UID'}
                                            placeholderTextColor={COLORS.textMuted}
                                            value={rfidInputs[u.rfidUid] ?? ''}
                                            autoCapitalize="characters"
                                            onChangeText={(value) =>
                                                setRfidInputs((prev) => ({ ...prev, [u.rfidUid]: value }))
                                            }
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.rfidAssignBtn}
                                        onPress={() => handleAssignRfid(u)}
                                        disabled={savingRfidFor === u.rfidUid}
                                    >
                                        <Text style={styles.rfidAssignBtnText}>
                                            {savingRfidFor === u.rfidUid ? 'Saving...' : 'Assign RFID'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.actionRow}>
                                    {u.hasFine && (
                                        <TouchableOpacity
                                            style={styles.clearFineBtn}
                                            onPress={() => handleClearFine(u)}
                                            disabled={actionRfid === u.rfidUid}
                                        >
                                            <Ionicons name="cash-outline" size={14} color={COLORS.warning} />
                                            <Text style={styles.clearFineBtnText}>Clear Fine</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.banBtn, u.isBanned ? styles.unbanBtn : styles.banBtnRed]}
                                        onPress={() => handleBan(u)}
                                        disabled={actionRfid === u.rfidUid}
                                    >
                                        <Ionicons
                                            name={u.isBanned ? 'checkmark-circle' : 'ban'}
                                            size={14}
                                            color={u.isBanned ? COLORS.success : COLORS.danger}
                                        />
                                        <Text style={[styles.banBtnText, { color: u.isBanned ? COLORS.success : COLORS.danger }]}>
                                            {u.isBanned ? 'Unban User' : 'Ban User'}
                                        </Text>
                                    </TouchableOpacity>
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
    centered: { justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: SIZES.paddingXL },
    scrollDesktop: { maxWidth: 960, alignSelf: 'center', width: '100%' },
    header: { marginBottom: 20 },
    headerTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
    headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.bgInput, borderRadius: SIZES.radiusSM,
        borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10,
        marginBottom: 16,
    },
    searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, outlineStyle: 'none' },
    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    summaryCard: {
        flex: 1, backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusSM, padding: 14,
        borderWidth: 1, borderColor: COLORS.border, borderLeftWidth: 3,
    },
    summaryValue: { fontSize: 18, ...FONTS.bold },
    summaryLabel: { fontSize: 11, color: COLORS.textMuted, ...FONTS.medium, marginTop: 2 },
    grid: { gap: 12 },
    gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    userCard: {
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radius, padding: 16,
        borderWidth: 1, borderColor: COLORS.border,
        ...(Platform.OS === 'web' ? { flexBasis: '48%', minWidth: 320 } : {}),
    },
    userCardBanned: { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.03)' },
    userHeader: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    avatarWrap: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 16, ...FONTS.bold, color: ADMIN_ACCENT },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    userName: { fontSize: 15, color: COLORS.textPrimary, ...FONTS.semibold },
    bannedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: COLORS.dangerGlow, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8,
    },
    bannedText: { fontSize: 9, color: COLORS.danger, ...FONTS.bold },
    userEmail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
    userStudentId: { fontSize: 11, color: COLORS.textMuted },
    userStats: { flexDirection: 'row', gap: 14, marginBottom: 12, flexWrap: 'wrap' },
    userStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    userStatValue: { fontSize: 13, color: COLORS.textPrimary, ...FONTS.semibold },
    userStatLabel: { fontSize: 11, color: COLORS.textMuted },
    rfidRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    rfidInputWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.bgInput,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    rfidInput: { flex: 1, color: COLORS.textPrimary, fontSize: 12, ...FONTS.medium, outlineStyle: 'none' },
    rfidAssignBtn: {
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.borderAccent,
        justifyContent: 'center',
        backgroundColor: COLORS.primaryGlow,
    },
    rfidAssignBtnText: { color: COLORS.primary, fontSize: 11, ...FONTS.semibold },
    actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    clearFineBtn: {
        flex: 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 8, borderRadius: 8, borderWidth: 1,
        backgroundColor: COLORS.warningGlow, borderColor: 'rgba(245,158,11,0.2)',
    },
    clearFineBtnText: { fontSize: 12, color: COLORS.warning, ...FONTS.semibold },
    banBtn: {
        flex: 1,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    },
    banBtnRed: { backgroundColor: COLORS.dangerGlow, borderColor: 'rgba(239,68,68,0.2)' },
    unbanBtn: { backgroundColor: COLORS.successGlow, borderColor: 'rgba(16,185,129,0.2)' },
    banBtnText: { fontSize: 12, ...FONTS.semibold },
});
