import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    Platform,
    useWindowDimensions,
    ScrollView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { BICYCLES } from '../../constants/mockData';

export default function ScanScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { user, activeRide, startRide } = useAuth();
    const [manualCode, setManualCode] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    const desktop = width >= 1024;
    const tablet = width >= 768;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const slideUp = useRef(new Animated.Value(30)).current;
    const resultScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideUp, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();

        // Request camera permission on mount (mobile only)
        if (Platform.OS !== 'web') {
            requestCameraPermission();
        }
    }, []);

    const requestCameraPermission = async () => {
        if (!permission) return;
        
        if (!permission.granted) {
            const { status } = await requestPermission();
            if (status !== 'granted') {
                Alert.alert(
                    'Camera Permission Required',
                    'CycleSync needs camera access to scan bicycle QR codes. You can also use manual entry.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    const handleBarCodeScanned = ({ data }) => {
        if (scanned || isProcessing) return;
        setScanned(true);
        handleScan(data);
        setTimeout(() => setScanned(false), 3000);
    };

    const toggleCamera = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Camera Not Available', 'Camera scanning is only available on mobile devices. Please use manual entry.');
            return;
        }

        if (!permission?.granted) {
            const { status } = await requestPermission();
            if (status !== 'granted') {
                Alert.alert(
                    'Camera Permission Required',
                    'Please grant camera permission in your device settings to scan QR codes.',
                    [{ text: 'OK' }]
                );
                return;
            }
        }
        setShowCamera(!showCamera);
    };

    useEffect(() => {
        if (scanResult) {
            resultScale.setValue(0);
            Animated.spring(resultScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start();
        }
    }, [scanResult]);

    const handleScan = (code) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setScanResult(null);

        if (activeRide) {
            setScanResult({ type: 'error', message: 'You already have an active ride. End it first before starting a new one.' });
            setIsProcessing(false);
            return;
        }

        if (user && user.dailyUsage >= user.maxDailyUsage) {
            setScanResult({ type: 'error', message: 'Daily limit reached (60 min). Come back tomorrow!' });
            setIsProcessing(false);
            return;
        }

        const bicycle = BICYCLES.find((b) => b.qrCode === code || b.id === code);

        if (!bicycle) {
            setScanResult({ type: 'error', message: `No bicycle found for code "${code}". Check and try again.` });
            setIsProcessing(false);
            return;
        }

        if (bicycle.status !== 'available') {
            setScanResult({
                type: 'error',
                message: `${bicycle.id} is currently ${bicycle.status.replace('_', ' ')}. Try another bicycle.`,
            });
            setIsProcessing(false);
            return;
        }

        const ride = startRide(bicycle.id);
        setScanResult({
            type: 'success',
            message: `🔓 ${bicycle.id} Unlocked! Starting your ride...`,
            ride,
            bicycle,
        });

        setTimeout(() => {
            router.push(`/ride/${ride.id}`);
        }, 2000);
    };

    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        handleScan(manualCode.trim().toUpperCase());
    };

    const scanFrameSize = desktop ? 280 : tablet ? 260 : width * 0.62;

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, desktop && styles.scrollContentDesktop]}
                showsVerticalScrollIndicator={false}
            >
                <View style={[desktop && styles.desktopContainer]}>
                    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideUp }] }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerIconBg}>
                                <Ionicons name="scan-outline" size={22} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={[styles.title, desktop && styles.titleDesktop]}>Scan QR Code</Text>
                                <Text style={styles.subtitle}>Scan the QR on any available bicycle to unlock it</Text>
                            </View>
                        </View>

                        {/* Desktop: two column layout */}
                        <View style={[tablet && styles.twoCol]}>
                            {/* Scanner Area */}
                            <View style={[styles.scannerArea, tablet && { flex: 1 }]}>
                                {showCamera && permission?.granted && Platform.OS !== 'web' ? (
                                    <View style={[styles.cameraContainer, { width: scanFrameSize, height: scanFrameSize }]}>
                                        <CameraView
                                            style={styles.camera}
                                            facing="back"
                                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                                            barcodeScannerSettings={{
                                                barcodeTypes: ['qr'],
                                            }}
                                        >
                                            <View style={styles.cameraOverlay}>
                                                <View style={[styles.corner, styles.topLeft]} />
                                                <View style={[styles.corner, styles.topRight]} />
                                                <View style={[styles.corner, styles.bottomLeft]} />
                                                <View style={[styles.corner, styles.bottomRight]} />
                                                <Text style={styles.cameraText}>Position QR code within frame</Text>
                                            </View>
                                        </CameraView>
                                        <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setShowCamera(false)}>
                                            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Animated.View
                                        style={[
                                            styles.scanFrame,
                                            { width: scanFrameSize, height: scanFrameSize, transform: [{ scale: pulseAnim }] },
                                        ]}
                                    >
                                        <View style={[styles.corner, styles.topLeft]} />
                                        <View style={[styles.corner, styles.topRight]} />
                                        <View style={[styles.corner, styles.bottomLeft]} />
                                        <View style={[styles.corner, styles.bottomRight]} />

                                        <View style={styles.scanCenter}>
                                            <View style={styles.scanQRBg}>
                                                <Ionicons name="qr-code" size={52} color={COLORS.primary} />
                                            </View>
                                            <Text style={styles.scanText}>
                                                {Platform.OS === 'web' ? 'Use manual entry or tap a bike below' : 'Tap button below to scan'}
                                            </Text>
                                            {Platform.OS !== 'web' && (
                                                <TouchableOpacity style={styles.scanButton} onPress={toggleCamera}>
                                                    <Ionicons name="camera" size={20} color="#fff" />
                                                    <Text style={styles.scanButtonText}>Open Camera</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View style={styles.scanLine} />
                                    </Animated.View>
                                )}

                                {/* Result Banner */}
                                {scanResult && (
                                    <Animated.View
                                        style={[
                                            styles.resultBanner,
                                            scanResult.type === 'success' ? styles.resultSuccess : styles.resultError,
                                            { transform: [{ scale: resultScale }] },
                                        ]}
                                    >
                                        <Ionicons
                                            name={scanResult.type === 'success' ? 'checkmark-circle' : 'close-circle'}
                                            size={22}
                                            color={scanResult.type === 'success' ? COLORS.success : COLORS.danger}
                                        />
                                        <Text
                                            style={[
                                                styles.resultText,
                                                { color: scanResult.type === 'success' ? COLORS.success : COLORS.danger },
                                            ]}
                                        >
                                            {scanResult.message}
                                        </Text>
                                    </Animated.View>
                                )}
                            </View>

                            {tablet && <View style={{ width: 24 }} />}

                            {/* Right panel */}
                            <View style={[tablet && { flex: 1 }]}>
                                {/* Manual Entry */}
                                <View style={styles.manualSection}>
                                    <TouchableOpacity
                                        style={styles.manualToggle}
                                        onPress={() => setShowManual(!showManual)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.manualToggleLeft}>
                                            <View style={styles.manualIconBg}>
                                                <Ionicons name="keypad-outline" size={18} color={COLORS.primary} />
                                            </View>
                                            <Text style={styles.manualToggleText}>Enter code manually</Text>
                                        </View>
                                        <Ionicons
                                            name={showManual ? 'chevron-up' : 'chevron-down'}
                                            size={18}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>

                                    {showManual && (
                                        <View style={styles.manualInputRow}>
                                            <TextInput
                                                style={styles.manualInput}
                                                placeholder="e.g. CYCLE-001"
                                                placeholderTextColor={COLORS.textMuted}
                                                value={manualCode}
                                                onChangeText={setManualCode}
                                                autoCapitalize="characters"
                                                onSubmitEditing={handleManualSubmit}
                                            />
                                            <TouchableOpacity
                                                style={[styles.manualSubmitBtn, !manualCode.trim() && { opacity: 0.5 }]}
                                                onPress={handleManualSubmit}
                                                activeOpacity={0.7}
                                                disabled={!manualCode.trim()}
                                            >
                                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                {/* Quick Select */}
                                <View style={styles.quickSelect}>
                                    <View style={styles.quickSelectHeader}>
                                        <Ionicons name="bicycle-outline" size={18} color={COLORS.success} />
                                        <Text style={styles.quickSelectTitle}>Available Nearby</Text>
                                        <View style={styles.countBadge}>
                                            <Text style={styles.countBadgeText}>
                                                {BICYCLES.filter((b) => b.status === 'available').length}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.quickSelectGrid}>
                                        {BICYCLES.filter((b) => b.status === 'available')
                                            .slice(0, desktop ? 8 : 6)
                                            .map((bike, i) => (
                                                <TouchableOpacity
                                                    key={bike.id}
                                                    style={styles.quickBikeBtn}
                                                    onPress={() => handleScan(bike.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons name="bicycle" size={16} color={COLORS.success} />
                                                    <Text style={styles.quickBikeId}>{bike.id.replace('CYCLE-', '#')}</Text>
                                                    <Text style={styles.quickBikeSpot} numberOfLines={1}>{bike.nearestSpot}</Text>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                </View>

                                {/* Usage info card */}
                                <View style={styles.infoCard}>
                                    <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoTitle}>Ride Rules</Text>
                                        <Text style={styles.infoText}>• Max 20 min per ride  • 60 min daily limit</Text>
                                        <Text style={styles.infoText}>• Park at designated spots only</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
    },
    scrollContent: {
        paddingTop: Platform.select({ web: 24, default: 56 }),
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    scrollContentDesktop: {
        paddingHorizontal: 40,
        paddingTop: 32,
    },
    desktopContainer: {
        maxWidth: 1100,
        alignSelf: 'center',
        width: '100%',
    },
    content: {},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
    },
    headerIconBg: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderAccent,
    },
    title: {
        fontSize: SIZES.xxl,
        color: COLORS.textPrimary,
        ...FONTS.bold,
    },
    titleDesktop: {
        fontSize: 30,
    },
    subtitle: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        marginTop: 2,
    },

    twoCol: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    // Scanner
    scannerArea: {
        alignItems: 'center',
        marginBottom: 24,
    },
    cameraContainer: {
        borderRadius: SIZES.radiusXL,
        overflow: 'hidden',
        position: 'relative',
    },
    camera: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cameraText: {
        position: 'absolute',
        bottom: 30,
        color: '#fff',
        fontSize: SIZES.sm,
        ...FONTS.medium,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: SIZES.radiusSM,
    },
    closeCameraBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderColor: COLORS.primary,
    },
    topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
    topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 10 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 10 },
    scanCenter: {
        alignItems: 'center',
        gap: 14,
    },
    scanQRBg: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderAccent,
    },
    scanText: {
        fontSize: SIZES.sm,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        textAlign: 'center',
        maxWidth: 200,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: SIZES.radius,
        marginTop: 16,
        ...SHADOWS.button,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: SIZES.md,
        ...FONTS.semibold,
    },
    scanLine: {
        position: 'absolute',
        width: '80%',
        height: 2,
        backgroundColor: COLORS.primary,
        opacity: 0.4,
        top: '50%',
        borderRadius: 1,
    },

    // Result
    resultBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: SIZES.radius,
        marginTop: 16,
        gap: 10,
        width: '100%',
    },
    resultSuccess: {
        backgroundColor: COLORS.successGlow,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    resultError: {
        backgroundColor: COLORS.dangerGlow,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    resultText: {
        fontSize: SIZES.sm,
        ...FONTS.medium,
        flex: 1,
        lineHeight: 18,
    },

    // Manual
    manualSection: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusLG,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: 16,
    },
    manualToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    manualToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    manualIconBg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    manualToggleText: {
        color: COLORS.textPrimary,
        fontSize: SIZES.md,
        ...FONTS.medium,
    },
    manualInputRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    manualInput: {
        flex: 1,
        backgroundColor: COLORS.bgInput,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        height: 48,
        color: COLORS.textPrimary,
        fontSize: SIZES.base,
        ...FONTS.medium,
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    manualSubmitBtn: {
        width: 48,
        height: 48,
        borderRadius: SIZES.radius,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.button,
    },

    // Quick Select
    quickSelect: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusLG,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
    },
    quickSelectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    quickSelectTitle: {
        fontSize: SIZES.md,
        color: COLORS.textPrimary,
        ...FONTS.semibold,
        flex: 1,
    },
    countBadge: {
        backgroundColor: COLORS.successGlow,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: SIZES.radiusFull,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    countBadgeText: {
        fontSize: 11,
        color: COLORS.success,
        ...FONTS.bold,
    },
    quickSelectGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickBikeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.bgInput,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: SIZES.radiusSM,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'border-color 0.15s' } : {}),
    },
    quickBikeId: {
        fontSize: SIZES.sm,
        color: COLORS.textPrimary,
        ...FONTS.semibold,
    },
    quickBikeSpot: {
        fontSize: 10,
        color: COLORS.textMuted,
        ...FONTS.regular,
        maxWidth: 70,
    },

    // Info Card
    infoCard: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radius,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'flex-start',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: SIZES.sm,
        color: COLORS.textPrimary,
        ...FONTS.semibold,
        marginBottom: 4,
    },
    infoText: {
        fontSize: SIZES.xs,
        color: COLORS.textMuted,
        ...FONTS.regular,
        lineHeight: 16,
    },
});
