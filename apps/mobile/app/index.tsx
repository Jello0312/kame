import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { COLORS } from '../src/theme/constants';

export default function Index() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.navy }}>
        <ActivityIndicator size="large" color={COLORS.tealBright} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/measurements" />;
  }

  return <Redirect href="/(tabs)/explore" />;
}
