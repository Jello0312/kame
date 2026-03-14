import { Stack } from 'expo-router';
import { COLORS } from '../../src/theme/constants';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: COLORS.navy },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
