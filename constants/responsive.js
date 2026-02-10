import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints
export const BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1440,
    ultrawide: 1920,
};

export const isDesktop = () => Dimensions.get('window').width >= BREAKPOINTS.desktop;
export const isTablet = () => {
    const w = Dimensions.get('window').width;
    return w >= BREAKPOINTS.tablet && w < BREAKPOINTS.desktop;
};
export const isMobile = () => Dimensions.get('window').width < BREAKPOINTS.tablet;
export const isWeb = Platform.OS === 'web';

// Get responsive value based on screen width
export const responsive = (mobile, tablet, desktop, wide) => {
    const w = Dimensions.get('window').width;
    if (w >= BREAKPOINTS.wide) return wide ?? desktop ?? tablet ?? mobile;
    if (w >= BREAKPOINTS.desktop) return desktop ?? tablet ?? mobile;
    if (w >= BREAKPOINTS.tablet) return tablet ?? mobile;
    return mobile;
};

// Container max-width for centering on desktop
export const getContainerStyle = () => {
    const w = Dimensions.get('window').width;
    if (w >= BREAKPOINTS.ultrawide) {
        return { maxWidth: 1200, alignSelf: 'center', width: '100%' };
    }
    if (w >= BREAKPOINTS.wide) {
        return { maxWidth: 1100, alignSelf: 'center', width: '100%' };
    }
    if (w >= BREAKPOINTS.desktop) {
        return { maxWidth: 960, alignSelf: 'center', width: '100%' };
    }
    if (w >= BREAKPOINTS.tablet) {
        return { maxWidth: 720, alignSelf: 'center', width: '100%' };
    }
    return {};
};

// Grid columns based on width
export const getGridColumns = (minWidth = 160) => {
    const w = Dimensions.get('window').width;
    if (w >= BREAKPOINTS.ultrawide) return Math.floor((1200 - 80) / (minWidth + 16));
    if (w >= BREAKPOINTS.wide) return Math.floor((1100 - 80) / (minWidth + 16));
    if (w >= BREAKPOINTS.desktop) return Math.floor((960 - 80) / (minWidth + 12));
    if (w >= BREAKPOINTS.tablet) return Math.floor((720 - 64) / (minWidth + 12));
    const padding = 40;
    return Math.max(2, Math.floor((w - padding) / (minWidth + 12)));
};

// Card width for grid layouts
export const getCardWidth = (columns, gap = 12) => {
    const w = Dimensions.get('window').width;
    const maxW = getContainerStyle().maxWidth || w;
    const padding = responsive(40, 64, 80, 80);
    const totalGaps = (columns - 1) * gap;
    return (maxW - padding - totalGaps) / columns;
};

// Responsive padding
export const getScreenPadding = () => responsive(20, 28, 40, 40);

// Responsive font sizes
export const responsiveFontSize = (base) => {
    const w = Dimensions.get('window').width;
    if (w >= BREAKPOINTS.wide) return base * 1.1;
    if (w >= BREAKPOINTS.desktop) return base * 1.05;
    if (w >= BREAKPOINTS.tablet) return base;
    return base * 0.95;
};

// Responsive spacing
export const responsiveSpacing = (base) => {
    const w = Dimensions.get('window').width;
    if (w >= BREAKPOINTS.wide) return base * 1.2;
    if (w >= BREAKPOINTS.desktop) return base * 1.1;
    if (w >= BREAKPOINTS.tablet) return base;
    return base * 0.9;
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
