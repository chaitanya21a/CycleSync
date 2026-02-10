import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { isDesktop, getContainerStyle, responsive, isWeb } from '../../constants/responsive';

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const { width } = useWindowDimensions();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [focusedInput, setFocusedInput] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const logoScale = useRef(new Animated.Value(0.5)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;
    const formSlide = useRef(new Animated.Value(60)).current;
    const formFade = useRef(new Animated.Value(0)).current;
    const featuresFade = useRef(new Animated.Value(0)).current;

    const desktop = width >= 1024;
    const tablet = width >= 768 && width < 1024;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
                Animated.timing(logoRotate, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(formFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.spring(formSlide, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
            ]),
            Animated.timing(featuresFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const result = await login(email, password);
            if (result.role === 'admin') {
                router.replace('/(admin)');
            } else {
                router.replace('/(tabs)');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const spin = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const features = [
        { icon: 'qr-code-outline', label: 'Scan & Ride', desc: 'Unlock with QR' },
        { icon: 'time-outline', label: 'Time Tracked', desc: '20 min per ride' },
        { icon: 'location-outline', label: 'GPS Enabled', desc: 'Smart parking' },
        { icon: 'shield-checkmark-outline', label: 'Secure', desc: 'Campus verified' },
    ];

    const renderBranding = () => (
        <Animated.View
            style={[
                styles.brandContainer,
                desktop && styles.brandContainerDesktop,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
        >
            <Animated.View
                style={[
                    styles.logoCircle,
                    desktop && styles.logoCircleDesktop,
                    { transform: [{ scale: logoScale }, { rotate: spin }] },
                ]}
            >
                <Ionicons name="bicycle" size={desktop ? 52 : 40} color={COLORS.primary} />
            </Animated.View>

            <Text style={[styles.appName, desktop && styles.appNameDesktop]}>CycleSync</Text>
            <Text style={[styles.tagline, desktop && styles.taglineDesktop]}>
                Smart Campus Bicycle Sharing
            </Text>

            {/* Feature pills — shown on desktop in the left panel */}
            {desktop && (
                <Animated.View style={[styles.featureGrid, { opacity: featuresFade }]}>
                    {features.map((f, i) => (
                        <View key={i} style={styles.featurePill}>
                            <View style={styles.featureIconBg}>
                                <Ionicons name={f.icon} size={18} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.featureLabel}>{f.label}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                        </View>
                    ))}
                </Animated.View>
            )}
        </Animated.View>
    );

    const renderForm = () => (
        <Animated.View
            style={[
                styles.formContainer,
                desktop && styles.formContainerDesktop,
                tablet && styles.formContainerTablet,
                { opacity: formFade, transform: [{ translateY: formSlide }] },
            ]}
        >
            <View style={styles.formHeader}>
                <Text style={[styles.welcomeText, desktop && styles.welcomeTextDesktop]}>
                    Welcome back 👋
                </Text>
                <Text style={styles.subtitle}>Sign in with your college email to continue</Text>
            </View>

            {error ? (
                <Animated.View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
            ) : null}

            {/* Email Input */}
            <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputWrapperFocused]}>
                <View style={[styles.inputIconContainer, focusedInput === 'email' && styles.inputIconFocused]}>
                    <Ionicons name="mail-outline" size={20} color={focusedInput === 'email' ? COLORS.primary : COLORS.textSecondary} />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="College Email (e.g. name@college.edu)"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                />
                {email.length > 0 && (
                    <TouchableOpacity style={styles.clearBtn} onPress={() => setEmail('')}>
                        <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Password Input */}
            <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}>
                <View style={[styles.inputIconContainer, focusedInput === 'password' && styles.inputIconFocused]}>
                    <Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? COLORS.primary : COLORS.textSecondary} />
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
            >
                <View style={styles.btnGradient}>
                    {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="log-in-outline" size={22} color="#fff" />
                            <Text style={styles.loginBtnText}>Sign In</Text>
                            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
                        </>
                    )}
                </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <Link href="/(auth)/signup" asChild>
                <TouchableOpacity style={styles.signupBtn} activeOpacity={0.7}>
                    <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.signupBtnText}>Create New Account</Text>
                </TouchableOpacity>
            </Link>

            {/* Mobile features */}
            {!desktop && (
                <Animated.View style={[styles.featureRowMobile, { opacity: featuresFade }]}>
                    {features.map((f, i) => (
                        <View key={i} style={styles.featureMobileItem}>
                            <View style={styles.featureMobileIcon}>
                                <Ionicons name={f.icon} size={16} color={COLORS.primary} />
                            </View>
                            <Text style={styles.featureMobileLabel}>{f.label}</Text>
                        </View>
                    ))}
                </Animated.View>
            )}
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContainer,
                    desktop && styles.scrollContainerDesktop,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {desktop ? (
                    <View style={styles.desktopLayout}>
                        {renderBranding()}
                        {renderForm()}
                    </View>
                ) : (
                    <View style={[styles.mobileLayout, tablet && styles.tabletLayout]}>
                        {renderBranding()}
                        {renderForm()}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPrimary,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    scrollContainerDesktop: {
        paddingHorizontal: 40,
        paddingVertical: 60,
    },

    // Layouts
    desktopLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        gap: 80,
    },
    mobileLayout: {
        flex: 1,
        justifyContent: 'center',
    },
    tabletLayout: {
        maxWidth: 500,
        alignSelf: 'center',
        width: '100%',
    },

    // Branding
    brandContainer: {
        alignItems: 'center',
        marginBottom: 36,
    },
    brandContainerDesktop: {
        flex: 1,
        alignItems: 'flex-start',
        marginBottom: 0,
        paddingRight: 20,
    },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primaryGlow,
        borderWidth: 2,
        borderColor: COLORS.borderAccent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...SHADOWS.glow(COLORS.primary),
    },
    logoCircleDesktop: {
        width: 110,
        height: 110,
        borderRadius: 55,
        marginBottom: 28,
    },
    appName: {
        fontSize: 42,
        color: COLORS.textPrimary,
        ...FONTS.heavy,
        letterSpacing: 1,
    },
    appNameDesktop: {
        fontSize: 52,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        marginTop: 6,
    },
    taglineDesktop: {
        fontSize: SIZES.lg,
        marginTop: 8,
    },

    // Desktop feature pills
    featureGrid: {
        marginTop: 40,
        gap: 12,
        width: '100%',
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radius,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    featureIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureLabel: {
        fontSize: SIZES.md,
        color: COLORS.textPrimary,
        ...FONTS.semibold,
    },
    featureDesc: {
        fontSize: SIZES.sm,
        color: COLORS.textMuted,
        ...FONTS.regular,
        marginTop: 1,
    },

    // Form
    formContainer: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusXL,
        padding: 28,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    formContainerDesktop: {
        flex: 1,
        maxWidth: 480,
        padding: 40,
    },
    formContainerTablet: {
        padding: 36,
    },
    formHeader: {
        marginBottom: 28,
    },
    welcomeText: {
        fontSize: 28,
        color: COLORS.textPrimary,
        ...FONTS.bold,
        marginBottom: 8,
    },
    welcomeTextDesktop: {
        fontSize: 32,
    },
    subtitle: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        lineHeight: 22,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.dangerGlow,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: SIZES.radiusSM,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        gap: 10,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: SIZES.sm,
        ...FONTS.medium,
        flex: 1,
    },

    // Input
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgInput,
        borderRadius: SIZES.radius,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        marginBottom: 16,
        height: 56,
        ...(Platform.OS === 'web' ? { transition: 'border-color 0.2s, box-shadow 0.2s' } : {}),
    },
    inputWrapperFocused: {
        borderColor: COLORS.primary,
        ...(Platform.OS === 'web'
            ? { boxShadow: '0 0 0 3px rgba(0, 212, 255, 0.1)' }
            : SHADOWS.glow(COLORS.primary)),
    },
    inputIconContainer: {
        paddingLeft: 16,
        paddingRight: 6,
    },
    inputIconFocused: {},
    input: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: SIZES.base,
        ...FONTS.regular,
        paddingHorizontal: 10,
        height: '100%',
        ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
    },
    clearBtn: {
        padding: 10,
    },
    eyeIcon: {
        padding: 12,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotText: {
        color: COLORS.primary,
        fontSize: SIZES.sm,
        ...FONTS.medium,
    },

    // Button
    loginBtn: {
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        ...SHADOWS.button,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        gap: 10,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: SIZES.lg,
        ...FONTS.semibold,
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.textMuted,
        fontSize: SIZES.sm,
        ...FONTS.regular,
    },

    // Signup button
    signupBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: SIZES.radius,
        borderWidth: 1.5,
        borderColor: COLORS.borderAccent,
        backgroundColor: COLORS.primaryGlow,
    },
    signupBtnText: {
        color: COLORS.primary,
        fontSize: SIZES.base,
        ...FONTS.semibold,
    },

    // Mobile features row
    featureRowMobile: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    featureMobileItem: {
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    featureMobileIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLORS.primaryGlow,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureMobileLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        ...FONTS.medium,
        textAlign: 'center',
    },
});
