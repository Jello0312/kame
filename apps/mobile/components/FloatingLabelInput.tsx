// ═══════════════════════════════════════════════════════════════
// FloatingLabelInput — Animated label that rises on focus
// ═══════════════════════════════════════════════════════════════
// Reusable input with:
//   - Floating label (animates up when focused or has value)
//   - Optional password toggle (Eye/EyeOff)
//   - Error state (red border + message)
//   - Kame brand styling from theme constants
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';

import { COLORS, FONTS, RADIUS, SPACING, COMPONENT, TYPE } from '../src/theme/constants';

// ── Props ───────────────────────────────────────────────────

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  showToggle?: boolean;
  error?: string;
}

// ── Constants ───────────────────────────────────────────────

const LABEL_TOP_INACTIVE = 15; // centered vertically in 52px input
const LABEL_TOP_ACTIVE = -10;  // floats above the input
const LABEL_SIZE_INACTIVE = 16;
const LABEL_SIZE_ACTIVE = 12;
const ANIMATION_DURATION = 150;

// ── Component ───────────────────────────────────────────────

export function FloatingLabelInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  autoComplete,
  showToggle = false,
  error,
}: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isActive = isFocused || value.length > 0;

  // Animated values for label position and size
  const labelTop = useSharedValue(value.length > 0 ? LABEL_TOP_ACTIVE : LABEL_TOP_INACTIVE);
  const labelSize = useSharedValue(value.length > 0 ? LABEL_SIZE_ACTIVE : LABEL_SIZE_INACTIVE);

  const handleFocus = () => {
    setIsFocused(true);
    labelTop.value = withTiming(LABEL_TOP_ACTIVE, { duration: ANIMATION_DURATION });
    labelSize.value = withTiming(LABEL_SIZE_ACTIVE, { duration: ANIMATION_DURATION });
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value.length === 0) {
      labelTop.value = withTiming(LABEL_TOP_INACTIVE, { duration: ANIMATION_DURATION });
      labelSize.value = withTiming(LABEL_SIZE_INACTIVE, { duration: ANIMATION_DURATION });
    }
  };

  const labelStyle = useAnimatedStyle(() => ({
    top: labelTop.value,
    fontSize: labelSize.value,
  }));

  const borderColor = error
    ? COLORS.error
    : isFocused
      ? COLORS.inputBorderFocus
      : COLORS.inputBorder;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputContainer, { borderColor }]}>
        {/* Floating Label */}
        <Animated.Text
          style={[
            styles.label,
            {
              color: error
                ? COLORS.error
                : isFocused
                  ? COLORS.inputBorderFocus
                  : COLORS.gray400,
            },
            labelStyle,
          ]}
          pointerEvents="none"
        >
          {label}
        </Animated.Text>

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as any}
          style={[
            styles.input,
            showToggle ? { paddingRight: 48 } : null,
          ]}
        />

        {/* Password Toggle */}
        {showToggle && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={COLORS.gray400} />
            ) : (
              <Eye size={20} color={COLORS.gray400} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    height: COMPONENT.inputHeight,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderRadius: RADIUS.input,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: SPACING.lg,
    fontFamily: FONTS.medium,
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 8,
    fontFamily: FONTS.regular,
    fontSize: TYPE.bodyLg.fontSize,
    color: COLORS.gray700,
  },
  toggleButton: {
    position: 'absolute',
    right: SPACING.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorText: {
    ...TYPE.bodySm,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
