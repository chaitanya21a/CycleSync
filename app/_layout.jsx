import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
    return (
        <AuthProvider>
            <View style={{ flex: 1, backgroundColor: COLORS.bgPrimary }}>
                <StatusBar style="light" />
                <Stack
                    screenOptions={{
                        headerShown: false,
                        contentStyle: { backgroundColor: COLORS.bgPrimary },
                        animation: 'slide_from_right',
                    }}
                />
            </View>
        </AuthProvider>
    );
}
