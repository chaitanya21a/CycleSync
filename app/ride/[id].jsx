import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
    ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getActiveSession, endRideSession } from '../../services/firebaseService';
import { PARKING_SPOTS } from '../../constants/mockData';
import { responsive, getContainerStyle } from '../../constants/responsive';

const MAX_RIDE_MINUTES = 20;

export default function ActiveRideScreen() {
    const router = useRouter();
    const { id: rideCode } = useLocalSearchParams();
    const { user } = useAuth();
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [selectedSpot, setSelectedSpot] = useState(null);
    const [rideEnded, setRideEnded] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

        // Pulsing animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        // Timer
        timerRef.current = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);

        // Request location permission and start tracking
        requestLocationPermission();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Restore session state if app was backgrounded
    useEffect(() => {
        if (!user?.rfidUid) return;
        (async () => {
            try {
                const result = await getActiveSession(user.rfidUid);
                if (result?.sessionId) {
                    setSessionId(result.sessionId);
                }
            } catch (error) {
                console.error('Failed to restore active session:', error);
            }
        })();
    }, [user?.rfidUid]);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status === 'granted') {
                // Get initial location
                const location = await Location.getCurrentPositionAsync({});
                setCurrentLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                });

                // Watch location updates every 30 seconds
                Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 30000,
                        distanceInterval: 50,
                    },
                    (location) => {
                        setCurrentLocation({
                            lat: location.coords.latitude,
                            lng: location.coords.longitude,
                        });
                    }
                );
            } else {
                Alert.alert(
                    'Location Permission Required',
                    'CycleSync needs location access to track your ride and verify parking. Some features may not work properly.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Location permission error:', error);
        }
    };

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const remainingSeconds = MAX_RIDE_MINUTES * 60 - elapsedSeconds;
    const progress = Math.min(elapsedSeconds / (MAX_RIDE_MINUTES * 60), 1);
    const isOvertime = elapsedMinutes >= MAX_RIDE_MINUTES;

    const formatTimer = (totalSec) => {
        const min = Math.floor(Math.abs(totalSec) / 60);
        const sec = Math.abs(totalSec) % 60;
        return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleEndRide = () => {
        if (!selectedSpot) {
            Alert.alert(
                'Select Parking Spot',
                'Please select a parking spot to end your ride.',
                [{ text: 'OK' }]
            );
            return;
        }
        confirmEndRide(selectedSpot);
    };

    const confirmEndRide = async (spot) => {
        if (timerRef.current) clearInterval(timerRef.current);

        if (!user?.rfidUid || !sessionId) {
            Alert.alert(
                'No Active Session',
                'Could not find your ride session in Firebase. If you just scanned, wait for the hardware to register the session, then try again.',
                [{ text: 'OK' }]
            );
            timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
            return;
        }

        const endTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const durationMinutes = Math.round(elapsedSeconds / 60);

        try {
            await endRideSession(user.rfidUid, sessionId, endTime, durationMinutes);
        } catch (error) {
            console.error('Failed to end ride session:', error);
            Alert.alert(
                'Error',
                'Failed to end your ride. Please try again.',
                [{ text: 'OK' }]
            );
            // Restart timer so the ride is still tracked
            timerRef.current = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
            return;
        }

        setRideEnded(true);

        setTimeout(() => {
            router.replace('/(tabs)');
        }, 3000);
    };

    if (rideEnded) {
        return (
            <View style={styles.endedContainer}>
                <Animated.View style={[styles.endedContent, { opacity: fadeAnim }]}>
                    <View style={styles.endedIconCircle}>
                        <Ionicons name="checkmark" size={48} color={COLORS.success} />
                    </View>
                    <Text style={styles.endedTitle}>Ride Complete! 🎉</Text>
                    <Text style={styles.endedSub}>
                        Duration: {elapsedMinutes} min • Parked at {selectedSpot}
                    </Text>
                    {isOvertime && (
                        <View style={styles.overtimeWarning}>
                            <Ionicons name="warning" size={18} color={COLORS.warning} />
                            <Text style={styles.overtimeText}>
                                Overtime fine of ₹50 applied ({elapsedMinutes - MAX_RIDE_MINUTES} min over limit)
                            </Text>
                        </View>
                    )}
                    <Text style={styles.redirectText}>Redirecting to home...</Text>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Active Ride</Text>
                <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                </View>
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

                    {/* Bicycle Info */}
                    <View style={styles.bikeInfo}>
                        <Ionicons name="bicycle" size={24} color={COLORS.primary} />
                        <Text style={styles.bikeId}>{rideCode || 'BICYCLE'}</Text>
                        <View style={styles.unlockBadge}>
                            <Ionicons name="lock-open" size={12} color={COLORS.success} />
                            <Text style={styles.unlockText}>Unlocked</Text>
                        </View>
                    </View>

                    {/* Timer Circle */}
                    <View style={styles.timerSection}>
                        <Animated.View
                            style={[
                                styles.timerCircle,
                                isOvertime && styles.timerCircleOvertime,
                                { transform: [{ scale: isOvertime ? pulseAnim : 1 }] },
                            ]}
                        >
                            <Text style={styles.timerLabel}>
                                {isOvertime ? 'OVERTIME' : 'REMAINING'}
                            </Text>
                            <Text style={[styles.timerValue, isOvertime && styles.timerValueOvertime]}>
                                {isOvertime
                                    ? `+${formatTimer(elapsedSeconds - MAX_RIDE_MINUTES * 60)}`
                                    : formatTimer(remainingSeconds)}
                            </Text>
                            <Text style={styles.timerSub}>
                                {elapsedMinutes} min elapsed
                            </Text>
                        </Animated.View>

                        {/* Progress Ring (simplified) */}
                        <View style={styles.progressInfo}>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        {
                                            width: `${progress * 100}%`,
                                            backgroundColor: isOvertime ? COLORS.danger : progress > 0.75 ? COLORS.warning : COLORS.primary,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {Math.round(progress * 100)}% of {MAX_RIDE_MINUTES} min limit
                            </Text>
                        </View>
                    </View>

                    {/* Parking Spot Selection */}
                    <View style={styles.parkingSection}>
                        <Text style={styles.parkingSectionTitle}>
                            Select Parking Spot to End Ride
                        </Text>
                        <View style={styles.spotsGrid}>
                            {PARKING_SPOTS.map((spot) => (
                                <TouchableOpacity
                                    key={spot.id}
                                    style={[
                                        styles.spotBtn,
                                        selectedSpot === spot.name && styles.spotBtnSelected,
                                    ]}
                                    onPress={() => setSelectedSpot(spot.name)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.spotBtnIcon}>{spot.icon}</Text>
                                    <Text
                                        style={[
                                            styles.spotBtnName,
                                            selectedSpot === spot.name && styles.spotBtnNameSelected,
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {spot.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* End Ride Button */}
                    <TouchableOpacity
                        style={[styles.endRideBtn, !selectedSpot && styles.endRideBtnDisabled]}
                        onPress={handleEndRide}
                        activeOpacity={0.7}
                        disabled={!selectedSpot}
                    >
                        <Ionicons name="stop-circle" size={22} color="#fff" />
                        <Text style={styles.endRideBtnText}>
                            {selectedSpot ? `End Ride at ${selectedSpot}` : 'Select Spot to End Ride'}
                        </Text>
                    </TouchableOpacity>

                    {/* Warning */}
                    <View style={styles.warningBar}>
                        <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
                        <Text style={styles.warningBarText}>
                            Park only at designated spots. ₹100 fine for wrong parking.
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: responsive(20, 28, 40, 40),
        paddingTop: responsive(48, 52, 56, 60),
        paddingBottom: responsive(12, 14, 16, 18),
        backgroundColor: COLORS.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        ...getContainerStyle(),
        alignSelf: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: responsive(24, 28, 32, 40),
        ...getContainerStyle(),
        alignSelf: 'center',
    },
    content: {
        paddingHorizontal: responsive(20, 28, 40, 40),
        paddingTop: responsive(16, 18, 20, 24),
    },
    backBtn: {
        width: responsive(40, 44, 48, 48),
        height: responsive(40, 44, 48, 48),
        borderRadius: responsive(10, 11, 12, 12),
        backgroundColor: COLORS.bgCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    headerTitle: {
        fontSize: responsive(18, 19, 20, 22),
        color: COLORS.textPrimary,
        ...FONTS.semibold,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsive(5, 6, 6, 7),
        backgroundColor: COLORS.dangerGlow,
        paddingHorizontal: responsive(10, 11, 12, 14),
        paddingVertical: responsive(5, 6, 6, 7),
        borderRadius: SIZES.radiusFull,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    liveDot: {
        width: responsive(7, 8, 8, 9),
        height: responsive(7, 8, 8, 9),
        borderRadius: responsive(4, 4, 4, 5),
        backgroundColor: COLORS.danger,
    },
    liveText: {
        fontSize: responsive(10, 10, 11, 12),
        color: COLORS.danger,
        ...FONTS.bold,
        letterSpacing: 1,
    },

    // Bike Info
    bikeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsive(8, 9, 10, 12),
        marginBottom: responsive(16, 18, 20, 24),
    },
    bikeId: {
        fontSize: responsive(18, 19, 20, 22),
        color: COLORS.textPrimary,
        ...FONTS.bold,
    },
    unlockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsive(4, 4, 5, 5),
        backgroundColor: COLORS.successGlow,
        paddingHorizontal: responsive(9, 10, 11, 12),
        paddingVertical: responsive(4, 4, 5, 5),
        borderRadius: SIZES.radiusFull,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    unlockText: {
        fontSize: responsive(10, 10, 11, 12),
        color: COLORS.success,
        ...FONTS.semibold,
    },

    // Timer
    timerSection: {
        alignItems: 'center',
        marginBottom: responsive(20, 22, 24, 28),
    },
    timerCircle: {
        width: responsive(200, 220, 240, 260),
        height: responsive(200, 220, 240, 260),
        borderRadius: responsive(100, 110, 120, 130),
        backgroundColor: COLORS.bgCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: responsive(2, 3, 3, 4),
        borderColor: COLORS.borderAccent,
        marginBottom: responsive(14, 15, 16, 18),
        ...SHADOWS.card,
    },
    timerCircleOvertime: {
        borderColor: 'rgba(239, 68, 68, 0.5)',
        backgroundColor: COLORS.dangerGlow,
    },
    timerLabel: {
        fontSize: responsive(11, 12, 13, 14),
        color: COLORS.textSecondary,
        ...FONTS.medium,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: responsive(3, 4, 4, 5),
    },
    timerValue: {
        fontSize: responsive(34, 36, 38, 42),
        color: COLORS.primary,
        ...FONTS.bold,
        letterSpacing: 2,
    },
    timerValueOvertime: {
        color: COLORS.danger,
    },
    timerSub: {
        fontSize: responsive(11, 12, 13, 14),
        color: COLORS.textMuted,
        ...FONTS.regular,
        marginTop: responsive(3, 4, 4, 5),
    },
    progressInfo: {
        width: '100%',
        maxWidth: responsive(280, 300, 320, 360),
    },
    progressBarBg: {
        height: responsive(5, 6, 6, 7),
        backgroundColor: COLORS.bgInput,
        borderRadius: responsive(3, 3, 3, 4),
        overflow: 'hidden',
        marginBottom: responsive(5, 6, 6, 7),
    },
    progressBarFill: {
        height: '100%',
        borderRadius: responsive(3, 3, 3, 4),
    },
    progressText: {
        fontSize: responsive(10, 10, 11, 12),
        color: COLORS.textMuted,
        ...FONTS.regular,
        textAlign: 'center',
    },

    // Parking
    parkingSection: {
        marginBottom: responsive(16, 18, 20, 24),
    },
    parkingSectionTitle: {
        fontSize: responsive(14, 15, 16, 17),
        color: COLORS.textPrimary,
        ...FONTS.semibold,
        marginBottom: responsive(10, 11, 12, 14),
        textAlign: 'center',
    },
    spotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: responsive(8, 9, 10, 12),
        justifyContent: 'center',
    },
    spotBtn: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsive(5, 6, 6, 7),
        paddingHorizontal: responsive(8, 9, 10, 12),
        paddingVertical: responsive(10, 11, 12, 14),
        borderRadius: responsive(10, 11, 12, 14),
        backgroundColor: COLORS.bgCard,
        borderWidth: 2,
        borderColor: COLORS.border,
        width: responsive(100, 110, 120, 130),
        minHeight: responsive(75, 78, 80, 85),
    },
    spotBtnSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryGlow,
        borderWidth: 2,
    },
    spotBtnIcon: {
        fontSize: responsive(22, 23, 24, 26),
    },
    spotBtnName: {
        fontSize: responsive(10, 10, 11, 12),
        color: COLORS.textSecondary,
        ...FONTS.medium,
        textAlign: 'center',
    },
    spotBtnNameSelected: {
        color: COLORS.primary,
        ...FONTS.semibold,
    },

    // End Ride
    endRideBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: responsive(9, 10, 10, 12),
        backgroundColor: COLORS.danger,
        paddingVertical: responsive(16, 17, 18, 20),
        borderRadius: responsive(10, 11, 12, 14),
        marginBottom: responsive(14, 15, 16, 18),
        ...SHADOWS.card,
    },
    endRideBtnDisabled: {
        opacity: 0.4,
        backgroundColor: COLORS.textMuted,
    },
    endRideBtnText: {
        color: '#fff',
        fontSize: responsive(15, 16, 16, 17),
        ...FONTS.semibold,
    },

    // Warning
    warningBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsive(7, 8, 8, 9),
        paddingVertical: responsive(7, 8, 8, 9),
        justifyContent: 'center',
    },
    warningBarText: {
        fontSize: responsive(10, 10, 11, 12),
        color: COLORS.textMuted,
        ...FONTS.regular,
        textAlign: 'center',
    },

    // Ride Ended
    endedContainer: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: responsive(20, 28, 40, 40),
    },
    endedContent: {
        alignItems: 'center',
        maxWidth: responsive(400, 450, 500, 550),
    },
    endedIconCircle: {
        width: responsive(88, 92, 96, 104),
        height: responsive(88, 92, 96, 104),
        borderRadius: responsive(44, 46, 48, 52),
        backgroundColor: COLORS.successGlow,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: responsive(20, 22, 24, 28),
        borderWidth: responsive(2, 3, 3, 4),
        borderColor: 'rgba(16, 185, 129, 0.3)',
        ...SHADOWS.glow(COLORS.success),
    },
    endedTitle: {
        fontSize: responsive(22, 23, 24, 26),
        color: COLORS.textPrimary,
        ...FONTS.bold,
        marginBottom: responsive(7, 8, 8, 9),
        textAlign: 'center',
    },
    endedSub: {
        fontSize: responsive(14, 15, 16, 17),
        color: COLORS.textSecondary,
        ...FONTS.regular,
        textAlign: 'center',
    },
    overtimeWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: responsive(7, 8, 8, 9),
        marginTop: responsive(14, 15, 16, 18),
        backgroundColor: COLORS.warningGlow,
        paddingHorizontal: responsive(14, 15, 16, 18),
        paddingVertical: responsive(9, 10, 10, 11),
        borderRadius: responsive(10, 11, 12, 14),
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    overtimeText: {
        fontSize: responsive(12, 13, 14, 15),
        color: COLORS.warning,
        ...FONTS.medium,
        flex: 1,
    },
    redirectText: {
        fontSize: responsive(12, 13, 14, 15),
        color: COLORS.textMuted,
        ...FONTS.regular,
        marginTop: responsive(20, 22, 24, 28),
        textAlign: 'center',
    },
});
