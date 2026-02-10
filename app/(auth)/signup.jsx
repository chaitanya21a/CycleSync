import React, { useState, useRef } from 'react';
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
    ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function SignupScreen() {
    const router = useRouter();
    const { signup } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        studentId: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 2-step signup

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]).start();
    }, []);

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleNextStep = () => {
        if (!formData.name || !formData.email || !formData.studentId) {
            setError('Please fill in all fields');
            return;
        }
        const emailDomain = formData.email.split('@')[1];
        if (!emailDomain || (!emailDomain.endsWith('.edu') && !emailDomain.endsWith('.ac.in'))) {
            setError('Please use your college email (.edu or .ac.in)');
            return;
        }
        setError('');
        setCurrentStep(2);
    };

    const handleSignup = async () => {
        if (!formData.phone || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await signup(formData);
            router.replace('/(tabs)');
        } catch (err) {
            setError(err.message || 'Signup failed');
        } finally {
            setIsLoading(false);
        }
    };

    const renderInput = (icon, placeholder, field, options = {}) => (
        <View style={styles.inputWrapper}>
            <View style={styles.inputIconContainer}>
                <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                value={formData[field]}
                onChangeText={(v) => updateField(field, v)}
                autoCapitalize={options.autoCapitalize || 'none'}
                keyboardType={options.keyboardType || 'default'}
                secureTextEntry={options.secure && !showPassword}
            />
            {options.secure && (
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View
                    style={[
                        styles.content,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                    ]}
                >
                    {/* Logo */}
                    <View style={styles.brandContainer}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="bicycle" size={36} color={COLORS.primary} />
                        </View>
                        <Text style={styles.appName}>CycleSync</Text>
                    </View>

                    {/* Step Indicator */}
                    <View style={styles.stepContainer}>
                        <View style={[styles.stepDot, styles.stepActive]} />
                        <View style={[styles.stepLine, currentStep === 2 && styles.stepLineActive]} />
                        <View style={[styles.stepDot, currentStep === 2 && styles.stepActive]} />
                    </View>

                    {/* Form Card */}
                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>
                            {currentStep === 1 ? 'Create Account' : 'Almost there!'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {currentStep === 1
                                ? 'Enter your college details'
                                : 'Set up your credentials'}
                        </Text>

                        {error ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {currentStep === 1 ? (
                            <>
                                {renderInput('person-outline', 'Full Name', 'name', { autoCapitalize: 'words' })}
                                {renderInput('mail-outline', 'College Email', 'email', { keyboardType: 'email-address' })}
                                {renderInput('id-card-outline', 'Student / Roll Number', 'studentId')}

                                <TouchableOpacity
                                    style={styles.primaryBtn}
                                    onPress={handleNextStep}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.btnGradient}>
                                        <Text style={styles.primaryBtnText}>Continue</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {renderInput('call-outline', 'Phone Number', 'phone', { keyboardType: 'phone-pad' })}
                                {renderInput('lock-closed-outline', 'Password', 'password', { secure: true })}
                                {renderInput('lock-closed-outline', 'Confirm Password', 'confirmPassword', { secure: true })}

                                <View style={styles.btnRow}>
                                    <TouchableOpacity
                                        style={styles.backBtn}
                                        onPress={() => { setCurrentStep(1); setError(''); }}
                                    >
                                        <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
                                        <Text style={styles.backBtnText}>Back</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.primaryBtn, { flex: 1 }, isLoading && { opacity: 0.7 }]}
                                        onPress={handleSignup}
                                        disabled={isLoading}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.btnGradient}>
                                            {isLoading ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <>
                                                    <Text style={styles.primaryBtnText}>Create Account</Text>
                                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                                </>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Login Link */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.loginLink}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </Animated.View>
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
        paddingHorizontal: SIZES.paddingXL,
        paddingVertical: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.primaryGlow,
        borderWidth: 2,
        borderColor: COLORS.borderAccent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        ...SHADOWS.glow(COLORS.primary),
    },
    appName: {
        fontSize: SIZES.xxxl,
        color: COLORS.textPrimary,
        ...FONTS.heavy,
        letterSpacing: 1,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 0,
    },
    stepDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.border,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    stepActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        ...SHADOWS.glow(COLORS.primary),
    },
    stepLine: {
        width: 60,
        height: 2,
        backgroundColor: COLORS.border,
    },
    stepLineActive: {
        backgroundColor: COLORS.primary,
    },
    formContainer: {
        backgroundColor: COLORS.bgCard,
        borderRadius: SIZES.radiusXL,
        padding: SIZES.paddingXL,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...SHADOWS.card,
    },
    welcomeText: {
        fontSize: SIZES.xxl,
        color: COLORS.textPrimary,
        ...FONTS.bold,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: SIZES.md,
        color: COLORS.textSecondary,
        ...FONTS.regular,
        marginBottom: 24,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.dangerGlow,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: SIZES.radiusSM,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        color: COLORS.danger,
        fontSize: SIZES.sm,
        ...FONTS.medium,
        marginLeft: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.bgInput,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 16,
        height: 52,
    },
    inputIconContainer: {
        paddingLeft: 16,
        paddingRight: 4,
    },
    input: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: SIZES.base,
        ...FONTS.regular,
        paddingHorizontal: 12,
        height: '100%',
    },
    eyeIcon: {
        padding: 12,
    },
    primaryBtn: {
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        marginTop: 8,
        ...SHADOWS.button,
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        backgroundColor: COLORS.primary,
        borderRadius: SIZES.radius,
        gap: 8,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: SIZES.lg,
        ...FONTS.semibold,
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 4,
    },
    backBtnText: {
        color: COLORS.textSecondary,
        fontSize: SIZES.md,
        ...FONTS.medium,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    loginText: {
        color: COLORS.textSecondary,
        fontSize: SIZES.md,
        ...FONTS.regular,
    },
    loginLink: {
        color: COLORS.primary,
        fontSize: SIZES.md,
        ...FONTS.semibold,
    },
});
