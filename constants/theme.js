export const COLORS = {
    // Backgrounds
    bgPrimary: '#0A0E1A',
    bgSecondary: '#111827',
    bgCard: '#1A1F36',
    bgCardHover: '#222842',
    bgInput: '#1E2340',
    bgOverlay: 'rgba(10, 14, 26, 0.85)',

    // Accent
    primary: '#00D4FF',
    primaryDark: '#0099FF',
    primaryGlow: 'rgba(0, 212, 255, 0.15)',
    secondary: '#7C3AED',
    secondaryGlow: 'rgba(124, 58, 237, 0.15)',

    // Gradients
    gradientStart: '#00D4FF',
    gradientEnd: '#0099FF',
    gradientPurple: '#7C3AED',
    gradientPink: '#EC4899',

    // Status
    success: '#10B981',
    successGlow: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B',
    warningGlow: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',
    dangerGlow: 'rgba(239, 68, 68, 0.15)',
    info: '#3B82F6',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textAccent: '#00D4FF',

    // Borders
    border: '#2A2F45',
    borderLight: '#374151',
    borderAccent: 'rgba(0, 212, 255, 0.3)',
};

export const FONTS = {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    semibold: { fontFamily: 'System', fontWeight: '600' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
};

export const SIZES = {
    xs: 10,
    sm: 12,
    md: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    title: 40,

    // Spacing
    paddingXS: 4,
    paddingSM: 8,
    paddingMD: 12,
    padding: 16,
    paddingLG: 20,
    paddingXL: 24,
    paddingXXL: 32,

    // Border radius
    radiusSM: 8,
    radius: 12,
    radiusLG: 16,
    radiusXL: 20,
    radiusFull: 999,
};

// Responsive sizes helper
export const getResponsiveSizes = (width) => {
    const scale = width >= 1440 ? 1.1 : width >= 1024 ? 1.05 : width >= 768 ? 1 : 0.95;
    return {
        xs: Math.round(10 * scale),
        sm: Math.round(12 * scale),
        md: Math.round(14 * scale),
        base: Math.round(16 * scale),
        lg: Math.round(18 * scale),
        xl: Math.round(20 * scale),
        xxl: Math.round(24 * scale),
        xxxl: Math.round(32 * scale),
        title: Math.round(40 * scale),
    };
};

export const SHADOWS = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    glow: (color = COLORS.primary) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    }),
    button: {
        shadowColor: '#00D4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
};
