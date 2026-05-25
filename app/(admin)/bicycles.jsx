import React, { useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    useWindowDimensions, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const ADMIN_ACCENT = '#F59E0B';

export default function AdminBicycles() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            <Ionicons name="bicycle" size={22} color={ADMIN_ACCENT} /> Bicycles
                        </Text>
                        <Text style={styles.headerSub}>Fleet inventory</Text>
                    </View>

                    <View style={styles.emptyCard}>
                        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyTitle}>No bicycle data in Firebase</Text>
                        <Text style={styles.emptyText}>
                            The Firebase schema stores students and usage_logs only. Bicycle fleet
                            status will appear here when a bicycles node is added or hardware syncs
                            device data.
                        </Text>
                        <Text style={styles.emptyHint}>
                            Use Users and Rides tabs for live data.
                        </Text>
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
    header: { marginBottom: 24 },
    headerTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
    headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    emptyCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radius,
        padding: 32,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        gap: 12,
        ...(Platform.OS === 'web' ? { maxWidth: 520, alignSelf: 'center', width: '100%' } : {}),
    },
    emptyTitle: { fontSize: 18, color: COLORS.textPrimary, ...FONTS.semibold, textAlign: 'center' },
    emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
    emptyHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, textAlign: 'center' },
});
