import '../global.css';

import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../src/theme/constants';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-BoldItalic': require('../assets/fonts/PlusJakartaSans-BoldItalic.ttf'),
  });

  const { isAuthenticated, isLoading, hasCompletedOnboarding, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Hide splash when fonts loaded AND auth check complete
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Auth-based navigation routing
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && !hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding/measurements');
    } else if (isAuthenticated && hasCompletedOnboarding && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)/explore');
    }
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, fontsLoaded, segments]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.navy }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
