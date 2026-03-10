import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { KameLogo } from '../../components/KameLogo';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: COMPONENT.screenPadding,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: SPACING['2xl'] }}>
            <KameLogo size={40} />
          </View>

          {/* Heading */}
          <Text
            style={{
              ...TYPE.headingXl,
              color: COLORS.textPrimary,
              textAlign: 'center',
              marginBottom: SPACING.sm,
            }}
          >
            Create your account
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              ...TYPE.bodyMd,
              color: COLORS.gray400,
              textAlign: 'center',
              marginBottom: SPACING['3xl'],
            }}
          >
            Join Kame to discover your style
          </Text>

          {/* Name Label */}
          <Text
            style={{
              ...TYPE.bodySm,
              color: COLORS.gray400,
              marginBottom: SPACING.xs,
            }}
          >
            Name
          </Text>

          {/* Name Input */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="words"
            autoComplete="name"
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            style={{
              height: COMPONENT.inputHeight,
              backgroundColor: COLORS.inputBg,
              borderWidth: 1,
              borderColor:
                focusedField === 'name'
                  ? COLORS.inputBorderFocus
                  : COLORS.inputBorder,
              borderRadius: RADIUS.input,
              paddingHorizontal: SPACING.lg,
              fontFamily: FONTS.regular,
              fontSize: TYPE.bodyLg.fontSize,
              color: COLORS.gray700,
            }}
          />

          {/* Spacer */}
          <View style={{ height: SPACING.lg }} />

          {/* Email Label */}
          <Text
            style={{
              ...TYPE.bodySm,
              color: COLORS.gray400,
              marginBottom: SPACING.xs,
            }}
          >
            Email
          </Text>

          {/* Email Input */}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.gray400}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            style={{
              height: COMPONENT.inputHeight,
              backgroundColor: COLORS.inputBg,
              borderWidth: 1,
              borderColor:
                focusedField === 'email'
                  ? COLORS.inputBorderFocus
                  : COLORS.inputBorder,
              borderRadius: RADIUS.input,
              paddingHorizontal: SPACING.lg,
              fontFamily: FONTS.regular,
              fontSize: TYPE.bodyLg.fontSize,
              color: COLORS.gray700,
            }}
          />

          {/* Spacer */}
          <View style={{ height: SPACING.lg }} />

          {/* Password Label */}
          <Text
            style={{
              ...TYPE.bodySm,
              color: COLORS.gray400,
              marginBottom: SPACING.xs,
            }}
          >
            Password
          </Text>

          {/* Password Input */}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor={COLORS.gray400}
            secureTextEntry
            autoComplete="new-password"
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            style={{
              height: COMPONENT.inputHeight,
              backgroundColor: COLORS.inputBg,
              borderWidth: 1,
              borderColor:
                focusedField === 'password'
                  ? COLORS.inputBorderFocus
                  : COLORS.inputBorder,
              borderRadius: RADIUS.input,
              paddingHorizontal: SPACING.lg,
              fontFamily: FONTS.regular,
              fontSize: TYPE.bodyLg.fontSize,
              color: COLORS.gray700,
            }}
          />

          {/* Password Helper */}
          <Text
            style={{
              ...TYPE.bodySm,
              color: COLORS.gray400,
              marginTop: SPACING.xs,
            }}
          >
            Min 8 characters
          </Text>

          {/* Error Text */}
          {error ? (
            <Text
              style={{
                ...TYPE.bodySm,
                color: COLORS.error,
                marginTop: SPACING.sm,
              }}
            >
              {error}
            </Text>
          ) : null}

          {/* Spacer */}
          <View style={{ height: SPACING['2xl'] }} />

          {/* Create Account Button */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              height: COMPONENT.buttonHeight,
              backgroundColor: COLORS.ctaNavigation,
              borderRadius: RADIUS.button,
              alignItems: 'center',
              justifyContent: 'center',
              ...SHADOWS.tealButton,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 16,
                  color: COLORS.navy,
                }}
              >
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Log In Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: SPACING['2xl'],
            }}
          >
            <Text
              style={{
                ...TYPE.bodyMd,
                color: COLORS.gray400,
              }}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text
                style={{
                  ...TYPE.bodyMd,
                  color: COLORS.tealBright,
                  fontFamily: FONTS.semiBold,
                }}
              >
                Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
