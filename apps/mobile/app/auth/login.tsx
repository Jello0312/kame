import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
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
import { FloatingParticles } from '../../components/FloatingParticles';
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

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

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
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation is handled automatically by the root _layout.tsx redirect
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset is not yet available in the beta. Please contact support.',
      [{ text: 'OK' }],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animated background particles */}
      <FloatingParticles />

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
          <Text style={styles.heading}>Welcome back</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Form Card */}
          <Animated.View style={[styles.formCard, formAnimatedStyle]}>
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
              autoComplete="password"
              showToggle
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordRow}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Text */}
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up Link */}
          <View style={styles.signUpRow}>
            <Text style={styles.signUpPrompt}>
              Don&apos;t have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPE.bodyMd,
    color: COLORS.gray400,
    textAlign: 'center',
    marginBottom: SPACING['3xl'],
  },

  // Form card
  formCard: {
    backgroundColor: 'rgba(3, 33, 59, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(72, 230, 205, 0.12)',
    borderRadius: RADIUS.card,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },

  // Forgot password
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.sm,
  },
  forgotPasswordText: {
    ...TYPE.bodySm,
    color: COLORS.tealBright,
    fontFamily: FONTS.medium,
  },

  // Error
  errorText: {
    ...TYPE.bodySm,
    color: COLORS.error,
    marginBottom: SPACING.md,
  },

  // Sign In button
  signInButton: {
    height: COMPONENT.buttonHeight,
    backgroundColor: COLORS.ctaNavigation,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.tealButton,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },

  // Sign Up link
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  signUpPrompt: {
    ...TYPE.bodyMd,
    color: COLORS.gray400,
  },
  signUpLink: {
    ...TYPE.bodyMd,
    color: COLORS.tealBright,
    fontFamily: FONTS.semiBold,
  },
});
