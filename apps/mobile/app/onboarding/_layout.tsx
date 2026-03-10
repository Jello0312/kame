import { Stack } from 'expo-router';
import { COLORS } from '../../src/theme/constants';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
        contentStyle: { backgroundColor: COLORS.navy },
      }}
    />
  );
}
