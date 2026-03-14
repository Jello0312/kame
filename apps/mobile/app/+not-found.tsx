import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function NotFound() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/measurements" />;
  }

  return <Redirect href="/(tabs)/explore" />;
}
