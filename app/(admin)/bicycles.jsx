import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    useWindowDimensions, Animated, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { getInUseBicycles } from '../../services/firebaseService';

const ADMIN_ACCENT = '#F59E0B';

export default function AdminBicycles() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [bicycles, setBicycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    useEffect(() => {
        const loadBicycles = async () => {
            try {
                const data = await getInUseBicycles();
                setBicycles(data);
            } catch {
                setBicycles([]);
            } finally {
                setLoading(false);
            }
        };

        loadBicycles();
        const interval = setInterval(loadBicycles, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={ADMIN_ACCENT} />
            </View>
        );
    }

    if (bicycles.length === 0) {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                    <Animated.View style={{ opacity: fadeAnim }}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                <Ionicons name="bicycle" size={22} color={ADMIN_ACCENT} /> Bicycles In Use
                            </Text>
                            <Text style={styles.headerSub}>Real-time active rides from hardware</Text>
                        </View>

                        <View style={styles.emptyCard}>
                            <Ionicons name="bicycle-outline" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyTitle}>No bicycles in use</Text>
                            <Text style={styles.emptyText}>
                                Bicycles will appear here when students scan and start rides via RFID.
                            </Text>
                        </View>
                    </Animated.View>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            <Ionicons name="bicycle" size={22} color={ADMIN_ACCENT} /> Bicycles In Use
                        </Text>
                        <Text style={styles.headerSub}>{bicycles.length} active ride{bicycles.length !== 1 ? 's' : ''}</Text>
                    </View>

                    <View style={[styles.grid, desktop && styles.gridDesktop]}>
                        {bicycles.map((bike) => (
                            <View key={`${bike.riderRfid}-${bike.sessionId}`} style={styles.bikeCard}>
                                <View style={styles.bikeHeader}>
                                    <View style={[styles.bikeIcon, { backgroundColor: '#3B82F615' }]}>
                                        <Ionicons name="bicycle" size={20} color="#3B82F6" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.bikeId}>{bike.bicycleId}</Text>
                                        <View style={styles.sessionRow}>
                                            <Ionicons name="play-circle" size={12} color={COLORS.success} />
                                            <Text style={styles.sessionId}>Session: {bike.sessionId}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: '#3B82F620' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
                                        <Text style={[styles.statusText, { color: '#3B82F6' }]}>
                                            IN USE
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.bikeDetails}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                                        <Text style={styles.detailText}>
                                            Started: {new Date(bike.startTime?.replace(' ', 'T') || Date.now()).toLocaleTimeString('en-IN')}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="card-outline" size={13} color={COLORS.textMuted} />
                                        <Text style={styles.detailText}>Rider RFID: {bike.riderRfid}</Text>
                                    </View>
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
    header: { marginBottom: 24 },
    headerTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
    headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    grid: { gap: 12 },
    gridDesktop: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    bikeCard: { backgroundColor: COLORS.bgCard, borderRadius: SIZES.radius, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...(Platform.OS === 'web' ? { flexBasis: '48%', minWidth: 340 } : {}) },
    bikeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    bikeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    bikeId: { fontSize: 16, color: COLORS.textPrimary, ...FONTS.semibold },
    sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    sessionId: { fontSize: 11, color: COLORS.textMuted },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 11, ...FONTS.semibold },
    bikeDetails: { gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 12, color: COLORS.textSecondary },
    emptyCard: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 60,
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusLG,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyTitle: { fontSize: 18, color: COLORS.textPrimary, ...FONTS.semibold },
    emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 280 },
});
