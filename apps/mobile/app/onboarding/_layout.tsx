import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: '#F0FAFB' },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
