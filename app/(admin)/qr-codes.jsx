import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, ScrollView, StyleSheet, TouchableOpacity,
    useWindowDimensions, Animated, Platform, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { BICYCLES } from '../../constants/mockData';

const ADMIN_ACCENT = '#F59E0B';

export default function AdminQRCodes() {
    const { width } = useWindowDimensions();
    const desktop = width >= 1024;
    const [selectedBike, setSelectedBike] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const qrRef = useRef(null);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const handleGenerateQR = (bike) => {
        setSelectedBike(bike);
        setShowQR(true);
    };

    const handleRegenerateQR = (bike) => {
        Alert.alert(
            'Regenerate QR Code',
            `Generate a new QR code for ${bike.id}? The old code will no longer work.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Regenerate',
                    style: 'destructive',
                    onPress: () => {
                        // Generate new QR code
                        const newQRCode = `CS-${bike.id.split('-')[1]}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                        Alert.alert('Success', `New QR code generated: ${newQRCode}`);
                    },
                },
            ]
        );
    };

    const handleDownloadQR = () => {
        if (Platform.OS === 'web') {
            Alert.alert('Download', 'Right-click on the QR code to save the image.');
        } else {
            Alert.alert('Download', 'QR code download feature coming soon!');
        }
    };

    const handleShareQR = async () => {
        try {
            await Share.share({
                message: `QR Code for ${selectedBike?.id}: ${selectedBike?.qrCode}`,
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const handlePrintAll = () => {
        Alert.alert(
            'Print All QR Codes',
            'Generate a PDF with all bicycle QR codes for printing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate PDF',
                    onPress: () => {
                        Alert.alert('Coming Soon', 'PDF generation feature will be available soon!');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={[styles.scroll, desktop && styles.scrollDesktop]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>
                                <Ionicons name="qr-code" size={22} color={ADMIN_ACCENT} /> QR Code Management
                            </Text>
                            <Text style={styles.headerSub}>Generate and manage bicycle QR codes</Text>
                        </View>
                        <TouchableOpacity style={styles.printAllBtn} onPress={handlePrintAll}>
                            <Ionicons name="print" size={18} color={COLORS.primary} />
                            <Text style={styles.printAllText}>Print All</Text>
                        </TouchableOpacity>
                    </View>

                    {/* QR Code Display Modal */}
                    {showQR && selectedBike && (
                        <View style={styles.qrModal}>
                            <View style={styles.qrModalContent}>
                                <View style={styles.qrModalHeader}>
                                    <Text style={styles.qrModalTitle}>{selectedBike.id}</Text>
                                    <TouchableOpacity onPress={() => setShowQR(false)}>
                                        <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.qrCodeContainer}>
                                    <QRCode
                                        value={selectedBike.qrCode}
                                        size={desktop ? 280 : 220}
                                        backgroundColor="white"
                                        color="black"
                                        getRef={qrRef}
                                    />
                                </View>

                                <Text style={styles.qrCodeText}>{selectedBike.qrCode}</Text>

                                <View style={styles.qrActions}>
                                    <TouchableOpacity style={styles.qrActionBtn} onPress={handleDownloadQR}>
                                        <Ionicons name="download-outline" size={20} color={COLORS.primary} />
                                        <Text style={styles.qrActionText}>Download</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.qrActionBtn} onPress={handleShareQR}>
                                        <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                                        <Text style={styles.qrActionText}>Share</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.qrActionBtn, styles.qrActionBtnDanger]}
                                        onPress={() => handleRegenerateQR(selectedBike)}
                                    >
                                        <Ionicons name="refresh-outline" size={20} color={COLORS.danger} />
                                        <Text style={[styles.qrActionText, { color: COLORS.danger }]}>Regenerate</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Bicycle List */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
                        <Text style={styles.infoText}>
                            Click on any bicycle to view or regenerate its QR code. Print all codes for physical attachment.
                        </Text>
                    </View>

                    <View style={[styles.grid, desktop && styles.gridDesktop]}>
                        {BICYCLES.slice(0, 50).map((bike) => (
                            <TouchableOpacity
                                key={bike.id}
                                style={styles.bikeCard}
                                onPress={() => handleGenerateQR(bike)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.bikeHeader}>
                                    <View style={styles.bikeIconBg}>
                                        <Ionicons name="bicycle" size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.bikeId}>{bike.id}</Text>
                                        <Text style={styles.bikeQR} numberOfLines={1}>{bike.qrCode}</Text>
                                    </View>
                                    <View style={styles.qrIconBg}>
                                        <Ionicons name="qr-code-outline" size={18} color={ADMIN_ACCENT} />
                                    </View>
                                </View>
                                <View style={styles.bikeFooter}>
                                    <Text style={styles.bikeStatus}>{bike.status.replace('_', ' ')}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {BICYCLES.length > 50 && (
                        <Text style={styles.moreText}>Showing 50 of {BICYCLES.length} bicycles</Text>
                    )}
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bgPrimary },
    scroll: { padding: SIZES.paddingXL, paddingTop: Platform.select({ web: 24, default: 56 }) },
    scrollDesktop: { maxWidth: 1100, alignSelf: 'center', width: '100%', paddingTop: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    headerTitle: { fontSize: 24, color: COLORS.textPrimary, ...FONTS.bold },
    headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
    printAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primaryGlow,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.borderAccent,
    },
    printAllText: { color: COLORS.primary, fontSize: 14, ...FONTS.semibold },

    infoCard: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: COLORS.bgCard,
        padding: 14,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },
    infoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, ...FONTS.regular, lineHeight: 18 },

    grid: { gap: 12 },
    gridDesktop: { flexDirection: 'row', flexWrap: 'wrap' },
    bikeCard: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusLG,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'border-color 0.2s' } : {}),
    },
    bikeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    bikeIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bikeId: { fontSize: 15, color: COLORS.textPrimary, ...FONTS.semibold },
    bikeQR: { fontSize: 11, color: COLORS.textMuted, ...FONTS.regular, marginTop: 2 },
    qrIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(245,158,11,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bikeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
    bikeStatus: { fontSize: 12, color: COLORS.textSecondary, ...FONTS.medium, textTransform: 'capitalize' },

    // QR Modal
    qrModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 20,
    },
    qrModalContent: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusXL,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    qrModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    qrModalTitle: { fontSize: 20, color: COLORS.textPrimary, ...FONTS.bold },
    qrCodeContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: SIZES.radiusLG,
        alignItems: 'center',
        marginBottom: 16,
    },
    qrCodeText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        ...FONTS.medium,
        textAlign: 'center',
        marginBottom: 20,
    },
    qrActions: { flexDirection: 'row', gap: 10 },
    qrActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.primaryGlow,
        borderWidth: 1,
        borderColor: COLORS.borderAccent,
    },
    qrActionBtnDanger: {
        backgroundColor: COLORS.dangerGlow,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    qrActionText: { fontSize: 13, color: COLORS.primary, ...FONTS.semibold },

    moreText: { textAlign: 'center', fontSize: 13, color: COLORS.textMuted, marginTop: 16 },
});
