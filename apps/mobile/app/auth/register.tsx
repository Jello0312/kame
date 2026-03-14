import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useAuthStore } from '../../stores/authStore';
import { KameLogo } from '../../components/KameLogo';
import { AuthBackground } from '../../components/AuthBackground';
import { FloatingLabelInput } from '../../components/FloatingLabelInput';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
  COMPONENT,
  SHADOWS,
} from '../../src/theme/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Form card entrance animation ────────────────────────────
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);

  useEffect(() => {
    formOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
    formTranslateY.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [formOpacity, formTranslateY]);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  // ── Handlers ────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(email.trim().toLowerCase(), password, name.trim());
      // Navigation is handled automatically by the root _layout.tsx redirect
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Light pastel flowing gradient background */}
      <AuthBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <KameLogo size={48} />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Create your account</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Join Kame to discover your style</Text>

          {/* Form Card */}
          <Animated.View style={[styles.formCard, formAnimatedStyle]}>
            {/* Name */}
            <FloatingLabelInput
              label="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />

            {/* Email */}
            <FloatingLabelInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {/* Password */}
            <FloatingLabelInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              showToggle
            />

            {/* Password Helper */}
            <Text style={styles.helperText}>Min 8 characters</Text>

            {/* Error Text */}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Create Account Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.createButton, loading && styles.createButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Log In Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0FAFB',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: COMPONENT.screenPadding,
  },

  // Logo & header
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  heading: {
    ...TYPE.headingXl,
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPE.bodyMd,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING['3xl'],
  },

  // Form card — frosted white glass on light background
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },

  // Helper text
  helperText: {
    ...TYPE.bodySm,
    color: COLORS.gray500,
    marginTop: -SPACING.md,
    marginBottom: SPACING.lg,
    marginLeft: SPACING.xs,
  },

  // Error
  errorText: {
    ...TYPE.bodySm,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },

  // Create Account button
  createButton: {
    height: COMPONENT.buttonHeight,
    backgroundColor: COLORS.ctaNavigation,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.tealButton,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },

  // Log In link
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  loginPrompt: {
    ...TYPE.bodyMd,
    color: COLORS.gray500,
  },
  loginLink: {
    ...TYPE.bodyMd,
    color: COLORS.teal,
    fontFamily: FONTS.semiBold,
  },
});
