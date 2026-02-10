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
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { PARKING_SPOTS } from '../../constants/mockData';

function SpotCard({ spot, index }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 60, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, delay: index * 60, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();
    }, []);

    const available = spot.capacity - spot.currentCount;
    const usage = (spot.currentCount / spot.capacity) * 100;
    const statusColor = usage > 80 ? COLORS.danger : usage > 50 ? COLORS.warning : COLORS.success;

    return (
        <Animated.View
            style={[
                styles.spotCard,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
        >
            <View style={styles.spotHeader}>
                <View style={styles.spotIconContainer}>
                    <Text style={styles.spotEmoji}>{spot.icon}</Text>
                </View>
                <View style={styles.spotInfo}>
                    <Text style={styles.spotName}>{spot.name}</Text>
                    <View style={styles.spotCoordRow}>
                        <Ionicons name="navigate-outline" size={10} color={COLORS.textMuted} />
                        <Text style={styles.spotCoords}>
                            {spot.location.lat.toFixed(4)}°N, {spot.location.lng.toFixed(4)}°E
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '18', borderColor: statusColor + '30' }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>{available} free</Text>
                </View>
            </View>

            <View style={styles.capacitySection}>
                <View style={styles.capacityBarBg}>
                    <View style={[styles.capacityBarFill, { width: `${usage}%`, backgroundColor: statusColor }]} />
                </View>
                <Text style={styles.capacityLabel}>{spot.currentCount} / {spot.capacity} occupied</Text>
            </View>

            <View style={styles.bikeIconsRow}>
                {Array.from({ length: Math.min(spot.capacity, 12) }).map((_, i) => (
                    <Ionicons key={i} name="bicycle" size={13} color={i < spot.currentCount ? COLORS.textSecondary : COLORS.border} />
                ))}
                {spot.capacity > 12 && <Text style={styles.moreText}>+{spot.capacity - 12}</Text>}
            </View>
        </Animated.View>
    );
}

export default function MapScreen() {
    const { width } = useWindowDimensions();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const desktop = width >= 1024;
    const tablet = width >= 768;

    const filters = [
        { id: 'all', label: 'All Spots', icon: 'grid-outline', count: PARKING_SPOTS.length },
        { id: 'available', label: 'Has Space', icon: 'checkmark-circle-outline', count: PARKING_SPOTS.filter(s => s.currentCount < s.capacity * 0.8).length },
        { id: 'full', label: 'Nearly Full', icon: 'warning-outline', count: PARKING_SPOTS.filter(s => s.currentCount >= s.capacity * 0.8).length },
    ];

    const filteredSpots = PARKING_SPOTS.filter((spot) => {
        if (selectedFilter === 'available') return spot.currentCount < spot.capacity * 0.8;
        if (selectedFilter === 'full') return spot.currentCount >= spot.capacity * 0.8;
        return true;
    });

    const totalCapacity = PARKING_SPOTS.reduce((sum, s) => sum + s.capacity, 0);
    const totalOccupied = PARKING_SPOTS.reduce((sum, s) => sum + s.currentCount, 0);
    const totalAvailable = totalCapacity - totalOccupied;

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, desktop && styles.scrollContentDesktop]}>
                <View style={desktop && styles.desktopContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerIconBg}>
                            <Ionicons name="location" size={22} color={COLORS.success} />
                        </View>
                        <View>
                            <Text style={[styles.title, desktop && { fontSize: 28 }]}>Parking Spots</Text>
                            <Text style={styles.subtitle}>Designated bicycle docking stations on campus</Text>
                        </View>
                    </View>

                    {/* Desktop: Map + Stats side by side */}
                    <View style={[tablet && { flexDirection: 'row', gap: 20 }]}>
                        {/* Map Placeholder */}
                        <View style={[styles.mapPlaceholder, tablet && { flex: 2 }]}>
                            <View style={styles.mapInner}>
                                <View style={styles.mapIconBg}>
                                    <Ionicons name="map" size={40} color={COLORS.primary} />
                                </View>
                                <Text style={styles.mapText}>Campus Map</Text>
                                <Text style={styles.mapSubtext}>Interactive map • Coming soon</Text>
                            </View>
                            <View style={styles.mapStats}>
                                <View style={styles.mapStat}>
                                    <Ionicons name="bicycle-outline" size={16} color={COLORS.success} />
                                    <Text style={styles.mapStatValue}>{totalAvailable}</Text>
                                    <Text style={styles.mapStatLabel}>Available</Text>
                                </View>
                                <View style={styles.mapStatDivider} />
                                <View style={styles.mapStat}>
                                    <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                                    <Text style={styles.mapStatValue}>{PARKING_SPOTS.length}</Text>
                                    <Text style={styles.mapStatLabel}>Stations</Text>
                                </View>
                                <View style={styles.mapStatDivider} />
                                <View style={styles.mapStat}>
                                    <Ionicons name="layers-outline" size={16} color={COLORS.secondary} />
                                    <Text style={styles.mapStatValue}>{totalCapacity}</Text>
                                    <Text style={styles.mapStatLabel}>Total Slots</Text>
                                </View>
                            </View>
                        </View>

                        {tablet && (
                            <View style={{ flex: 1 }}>
                                <View style={styles.legendCard}>
                                    <Text style={styles.legendTitle}>Status Guide</Text>
                                    {[
                                        { color: COLORS.success, label: 'Available', desc: 'Less than 50% full' },
                                        { color: COLORS.warning, label: 'Filling Up', desc: '50-80% capacity' },
                                        { color: COLORS.danger, label: 'Nearly Full', desc: 'Over 80% capacity' },
                                    ].map((item, i) => (
                                        <View key={i} style={styles.legendItem}>
                                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                            <View>
                                                <Text style={styles.legendLabel}>{item.label}</Text>
                                                <Text style={styles.legendDesc}>{item.desc}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Filters */}
                    <View style={styles.filterRow}>
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[styles.filterBtn, selectedFilter === filter.id && styles.filterBtnActive]}
                                onPress={() => setSelectedFilter(filter.id)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={filter.icon} size={14} color={selectedFilter === filter.id ? COLORS.primary : COLORS.textMuted} />
                                <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
                                    {filter.label}
                                </Text>
                                <View style={[styles.filterCount, selectedFilter === filter.id && styles.filterCountActive]}>
                                    <Text style={[styles.filterCountText, selectedFilter === filter.id && { color: COLORS.primary }]}>
                                        {filter.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Spot Cards - grid on desktop */}
                    <View style={[desktop && styles.spotsGrid]}>
                        {filteredSpots.map((spot, index) => (
                            <View key={spot.id} style={desktop && { width: '48%' }}>
                                <SpotCard spot={spot} index={index} />
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 24 }} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
    scrollContent: { paddingHorizontal: 20, paddingTop: Platform.select({ web: 24, default: 56 }), paddingBottom: 100 },
    scrollContentDesktop: { paddingHorizontal: 40, paddingTop: 32 },
    desktopContainer: { maxWidth: 1100, alignSelf: 'center', width: '100%' },

    header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
    headerIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.successGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
    title: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold },
    subtitle: { fontSize: SIZES.md, color: COLORS.textSecondary, ...FONTS.regular, marginTop: 2 },

    // Map
    mapPlaceholder: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusXL, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
    mapInner: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgInput, gap: 10 },
    mapIconBg: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderAccent },
    mapText: { fontSize: SIZES.xl, color: COLORS.textPrimary, ...FONTS.semibold },
    mapSubtext: { fontSize: SIZES.md, color: COLORS.textMuted, ...FONTS.regular },
    mapStats: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 18 },
    mapStat: { flex: 1, alignItems: 'center', gap: 5 },
    mapStatValue: { fontSize: SIZES.xxl, color: COLORS.textPrimary, ...FONTS.bold },
    mapStatLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.regular },
    mapStatDivider: { width: 1, backgroundColor: COLORS.border },

    // Legend
    legendCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 14 },
    legendTitle: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.semibold },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendLabel: { fontSize: SIZES.md, color: COLORS.textPrimary, ...FONTS.medium },
    legendDesc: { fontSize: 12, color: COLORS.textMuted, ...FONTS.regular },

    // Filters
    filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
    filterBtnActive: { borderColor: COLORS.borderAccent, backgroundColor: COLORS.primaryGlow },
    filterText: { fontSize: SIZES.md, color: COLORS.textMuted, ...FONTS.medium },
    filterTextActive: { color: COLORS.primary },
    filterCount: { backgroundColor: COLORS.bgInput, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
    filterCountActive: { backgroundColor: COLORS.borderAccent },
    filterCountText: { fontSize: 11, color: COLORS.textMuted, ...FONTS.bold },

    // Spots Grid (desktop)
    spotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },

    // Spot Card
    spotCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radiusLG, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...(Platform.OS === 'web' ? { transition: 'transform 0.15s' } : {}) },
    spotHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    spotIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.bgInput, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    spotEmoji: { fontSize: 24 },
    spotInfo: { flex: 1 },
    spotName: { fontSize: SIZES.lg, color: COLORS.textPrimary, ...FONTS.semibold },
    spotCoordRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    spotCoords: { fontSize: 11, color: COLORS.textMuted, ...FONTS.regular },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: SIZES.radiusFull, borderWidth: 1, gap: 5 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: SIZES.sm, ...FONTS.semibold },
    capacitySection: { marginBottom: 12 },
    capacityBarBg: { height: 7, backgroundColor: COLORS.bgInput, borderRadius: 4, overflow: 'hidden', marginBottom: 7 },
    capacityBarFill: { height: '100%', borderRadius: 4 },
    capacityLabel: { fontSize: SIZES.sm, color: COLORS.textSecondary, ...FONTS.regular },
    bikeIconsRow: { flexDirection: 'row', gap: 4, alignItems: 'center', flexWrap: 'wrap' },
    moreText: { fontSize: SIZES.sm, color: COLORS.textMuted, ...FONTS.regular, marginLeft: 4 },
});
