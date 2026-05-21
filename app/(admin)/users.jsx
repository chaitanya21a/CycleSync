import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import api from '../../services/api';

const ADMIN_ACCENT = '#F59E0B';

// Mock users data for admin
const MOCK_USERS = [
    { id: '1', name: 'Tanya Sharma', email: 'tanya.sharma@college.edu', studentId: 'CS2024001', totalRides: 24, totalFines: 150, pendingFines: 50, violationCount: 1, isBanned: false, rfidTagId: '' },
    { id: '2', name: 'Rahul Verma', email: 'rahul.verma@college.edu', studentId: 'ME2024015', totalRides: 45, totalFines: 300, pendingFines: 100, violationCount: 3, isBanned: false, rfidTagId: '' },
    { id: '3', name: 'Priya Singh', email: 'priya.singh@college.edu', studentId: 'EE2023008', totalRides: 12, totalFines: 0, pendingFines: 0, violationCount: 0, isBanned: false, rfidTagId: '' },
    { id: '4', name: 'Amit Kumar', email: 'amit.kumar@college.edu', studentId: 'CS2023042', totalRides: 67, totalFines: 550, pendingFines: 200, violationCount: 5, isBanned: true, rfidTagId: '' },
    { id: '5', name: 'Sneha Gupta', email: 'sneha.gupta@college.edu', studentId: 'IT2024007', totalRides: 31, totalFines: 100, pendingFines: 0, violationCount: 1, isBanned: false, rfidTagId: '' },
    { id: '6', name: 'Vikram Patel', email: 'vikram.patel@college.edu', studentId: 'CE2023019', totalRides: 8, totalFines: 200, pendingFines: 200, violationCount: 2, isBanned: false, rfidTagId: '' },
    { id: '7', name: 'Anjali Reddy', email: 'anjali.reddy@college.edu', studentId: 'EC2024033', totalRides: 52, totalFines: 400, pendingFines: 0, violationCount: 4, isBanned: false, rfidTagId: '' },
    { id: '8', name: 'Rohan Joshi', email: 'rohan.joshi@college.edu', studentId: 'ME2024028', totalRides: 3, totalFines: 100, pendingFines: 100, violationCount: 5, isBanned: true, rfidTagId: '' },
];

export default function AdminUsers() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [search, setSearch] = useState('');
    const [users, setUsers] = useState(MOCK_USERS);
    const [rfidInputs, setRfidInputs] = useState({});
    const [savingRfidFor, setSavingRfidFor] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const filtered = users.filter(u => {
        if (!search) return true;
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.studentId.toLowerCase().includes(q);
    });

    const handleBan = (userId) => {
        setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, isBanned: !u.isBanned } : u
        ));
    };

    const handleAssignRfid = async (user) => {
        const tagUid = String(rfidInputs[user.id] || '').trim().toUpperCase();
        if (!tagUid) {
            Alert.alert('Missing RFID UID', 'Enter RFID UID before assigning.');
            return;
        }

        setSavingRfidFor(user.id);
        try {
            await api.assignUserRfid(user.id, tagUid);
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, rfidTagId: tagUid } : u
            ));
            Alert.alert('Success', `RFID assigned to ${user.name}`);
        } catch (error) {
            // Keep local update for demo mode if backend is unavailable.
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, rfidTagId: tagUid } : u
            ));
            Alert.alert('Saved locally', 'Backend unavailable. RFID mapped in demo state.');
        } finally {
            setSavingRfidFor(null);
        }
    };

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

                    {/* Search */}
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

                    {/* Summary */}
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.success }]}>
                            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                                {users.filter(u => !u.isBanned).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Active</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
                            <Text style={[styles.summaryValue, { color: COLORS.danger }]}>
                                {users.filter(u => u.isBanned).length}
                            </Text>
                            <Text style={styles.summaryLabel}>Banned</Text>
                        </View>
                        <View style={[styles.summaryCard, { borderLeftColor: COLORS.warning }]}>
                            <Text style={[styles.summaryValue, { color: COLORS.warning }]}>
                                ₹{users.reduce((t, u) => t + u.pendingFines, 0)}
                            </Text>
                            <Text style={styles.summaryLabel}>Pending Fines</Text>
                        </View>
                    </View>

                    {/* User Cards */}
                    <View style={[styles.grid, desktop && styles.gridDesktop]}>
                        {filtered.map((u, i) => (
                            <View key={u.id} style={[styles.userCard, u.isBanned && styles.userCardBanned]}>
                                <View style={styles.userHeader}>
                                    <View style={styles.avatarWrap}>
                                        <Text style={styles.avatarText}>{u.name.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={styles.nameRow}>
                                            <Text style={styles.userName}>{u.name}</Text>
                                            {u.isBanned && (
                                                <View style={styles.bannedBadge}>
                                                    <Ionicons name="ban" size={10} color={COLORS.danger} />
                                                    <Text style={styles.bannedText}>BANNED</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.userEmail}>{u.email}</Text>
                                        <Text style={styles.userStudentId}>{u.studentId}</Text>
                                    </View>
                                </View>

                                <View style={styles.userStats}>
                                    <View style={styles.userStat}>
                                        <Ionicons name="bicycle-outline" size={14} color={COLORS.primary} />
                                        <Text style={styles.userStatValue}>{u.totalRides}</Text>
                                        <Text style={styles.userStatLabel}>rides</Text>
                                    </View>
                                    <View style={styles.userStat}>
                                        <Ionicons name="cash-outline" size={14} color={COLORS.warning} />
                                        <Text style={styles.userStatValue}>₹{u.totalFines}</Text>
                                        <Text style={styles.userStatLabel}>fines</Text>
                                    </View>
                                    <View style={styles.userStat}>
                                        <Ionicons name="alert-circle-outline" size={14} color={COLORS.danger} />
                                        <Text style={styles.userStatValue}>{u.violationCount}</Text>
                                        <Text style={styles.userStatLabel}>violations</Text>
                                    </View>
                                    {u.pendingFines > 0 && (
                                        <View style={styles.userStat}>
                                            <Ionicons name="time-outline" size={14} color={COLORS.warning} />
                                            <Text style={[styles.userStatValue, { color: COLORS.warning }]}>₹{u.pendingFines}</Text>
                                            <Text style={styles.userStatLabel}>due</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.rfidRow}>
                                    <View style={styles.rfidInputWrap}>
                                        <Ionicons name="card-outline" size={14} color={COLORS.textMuted} />
                                        <TextInput
                                            style={styles.rfidInput}
                                            placeholder={u.rfidTagId || 'RFID UID'}
                                            placeholderTextColor={COLORS.textMuted}
                                            value={rfidInputs[u.id] ?? ''}
                                            autoCapitalize="characters"
                                            onChangeText={(value) => setRfidInputs(prev => ({ ...prev, [u.id]: value }))}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.rfidAssignBtn}
                                        onPress={() => handleAssignRfid(u)}
                                        disabled={savingRfidFor === u.id}
                                    >
                                        <Text style={styles.rfidAssignBtnText}>
                                            {savingRfidFor === u.id ? 'Saving...' : 'Assign RFID'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={[styles.banBtn, u.isBanned ? styles.unbanBtn : styles.banBtnRed]}
                                    onPress={() => handleBan(u.id)}
                                >
                                    <Ionicons name={u.isBanned ? 'checkmark-circle' : 'ban'} size={14}
                                        color={u.isBanned ? COLORS.success : COLORS.danger} />
                                    <Text style={[styles.banBtnText, { color: u.isBanned ? COLORS.success : COLORS.danger }]}>
                                        {u.isBanned ? 'Unban User' : 'Ban User'}
                                    </Text>
                                </TouchableOpacity>
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
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    banBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    },
    banBtnRed: { backgroundColor: COLORS.dangerGlow, borderColor: 'rgba(239,68,68,0.2)' },
    unbanBtn: { backgroundColor: COLORS.successGlow, borderColor: 'rgba(16,185,129,0.2)' },
    banBtnText: { fontSize: 12, ...FONTS.semibold },
});
