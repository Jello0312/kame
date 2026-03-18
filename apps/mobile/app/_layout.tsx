import '../global.css';

import { useEffect, useState } from 'react';
import { Stack, useSegments, useRouter, useNavigationContainerRef, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { queryClient } from '../lib/queryClient';
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
  const navigationRef = useNavigationContainerRef();
  const [navReady, setNavReady] = useState(false);

  // Track when navigation container is ready
  useEffect(() => {
    if (navigationRef?.isReady()) {
      setNavReady(true);
    }
    const unsubscribe = navigationRef?.addListener?.('state', () => {
      if (navigationRef.isReady()) setNavReady(true);
    });
    return () => unsubscribe?.();
  }, [navigationRef]);

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

  // Auth-based navigation routing — only after navigator is mounted
  useEffect(() => {
    if (isLoading || !fontsLoaded || !navReady) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && !hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding' as Href);
    } else if (isAuthenticated && hasCompletedOnboarding && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)/explore');
    }
  }, [isAuthenticated, hasCompletedOnboarding, isLoading, fontsLoaded, navReady, segments]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.navy }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={segments[0] === "auth" ? "dark" : "light"} />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
