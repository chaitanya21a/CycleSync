import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { BICYCLES } from '../../constants/mockData';

const ADMIN_ACCENT = '#F59E0B';

const STATUS_COLORS = {
    available: COLORS.success,
    in_use: '#3B82F6',
    maintenance: COLORS.warning,
};
const CONDITION_COLORS = {
    good: COLORS.success,
    damaged: COLORS.danger,
    needs_repair: COLORS.warning,
};

export default function AdminBicycles() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const filters = [
        { key: 'all', label: 'All', count: BICYCLES.length },
        { key: 'available', label: 'Available', count: BICYCLES.filter(b => b.status === 'available').length },
        { key: 'in_use', label: 'In Use', count: BICYCLES.filter(b => b.status === 'in_use').length },
        { key: 'maintenance', label: 'Maintenance', count: BICYCLES.filter(b => b.status === 'maintenance').length },
    ];

    const filtered = BICYCLES.filter(b => {
        if (filter !== 'all' && b.status !== filter) return false;
        if (search && !b.id.toLowerCase().includes(search.toLowerCase()) && !b.nearestSpot.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>
                                <Ionicons name="bicycle" size={22} color={ADMIN_ACCENT} /> Bicycles
                            </Text>
                            <Text style={styles.headerSub}>{BICYCLES.length} total bicycles in fleet</Text>
                        </View>
                    </View>

                    {/* Search */}
                    <View style={styles.searchRow}>
                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={16} color={COLORS.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by ID or location..."
                                placeholderTextColor={COLORS.textMuted}
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>
                    </View>

                    {/* Filters */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                        {filters.map(f => (
                            <TouchableOpacity
                                key={f.key}
                                style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
                                onPress={() => setFilter(f.key)}
                            >
                                <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                                    {f.label}
                                </Text>
                                <View style={[styles.filterCount, filter === f.key && styles.filterCountActive]}>
                                    <Text style={[styles.filterCountText, filter === f.key && styles.filterCountTextActive]}>
                                        {f.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Bicycle Cards */}
                    <View style={[styles.grid, desktop && styles.gridDesktop]}>
                        {filtered.slice(0, 30).map((bike, i) => (
                            <View key={bike.id} style={styles.bikeCard}>
                                <View style={styles.bikeHeader}>
                                    <Text style={styles.bikeId}>{bike.id}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[bike.status]}20` }]}>
                                        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[bike.status] }]} />
                                        <Text style={[styles.statusText, { color: STATUS_COLORS[bike.status] }]}>
                                            {bike.status.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.bikeDetails}>
                                    <View style={styles.bikeDetail}>
                                        <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
                                        <Text style={styles.bikeDetailText}>{bike.nearestSpot}</Text>
                                    </View>
                                    <View style={styles.bikeDetail}>
                                        <Ionicons name="build-outline" size={13} color={CONDITION_COLORS[bike.condition]} />
                                        <Text style={[styles.bikeDetailText, { color: CONDITION_COLORS[bike.condition] }]}>
                                            {bike.condition.replace('_', ' ')}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.bikeActions}>
                                    <TouchableOpacity style={styles.actionBtn}>
                                        <Ionicons name="swap-horizontal" size={14} color={ADMIN_ACCENT} />
                                        <Text style={styles.actionBtnText}>Change Status</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    {filtered.length > 30 && (
                        <Text style={styles.moreText}>Showing 30 of {filtered.length} bicycles</Text>
                    )}
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
    searchRow: { marginBottom: 16 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.bgInput, borderRadius: SIZES.radiusSM,
        borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, outlineStyle: 'none' },
    filterRow: { marginBottom: 20, flexDirection: 'row' },
    filterChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
        marginRight: 8,
    },
    filterChipActive: { backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
    filterText: { fontSize: 13, color: COLORS.textSecondary, ...FONTS.medium },
    filterTextActive: { color: ADMIN_ACCENT },
    filterCount: {
        backgroundColor: COLORS.bgSecondary, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 10,
    },
    filterCountActive: { backgroundColor: 'rgba(245,158,11,0.25)' },
    filterCountText: { fontSize: 11, color: COLORS.textMuted, ...FONTS.semibold },
    filterCountTextActive: { color: ADMIN_ACCENT },
    grid: { gap: 10 },
    gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    bikeCard: {
        backgroundColor: COLORS.bgCard, borderRadius: SIZES.radius, padding: 16,
        borderWidth: 1, borderColor: COLORS.border,
        ...(Platform.OS === 'web' ? { flexBasis: '31%', minWidth: 260 } : {}),
    },
    bikeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    bikeId: { fontSize: 15, color: COLORS.textPrimary, ...FONTS.bold },
    statusBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, ...FONTS.semibold, textTransform: 'capitalize' },
    bikeDetails: { gap: 6, marginBottom: 12 },
    bikeDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bikeDetailText: { fontSize: 12, color: COLORS.textSecondary },
    bikeActions: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center',
        paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.1)',
    },
    actionBtnText: { fontSize: 12, color: ADMIN_ACCENT, ...FONTS.semibold },
    moreText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13, marginTop: 16, ...FONTS.medium },
});
