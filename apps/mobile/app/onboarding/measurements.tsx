import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOnboardingStore } from '../../stores/onboardingStore';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
  COMPONENT,
  SHADOWS,
} from '../../src/theme/constants';

const BODY_SHAPES = [
  { value: 'HOURGLASS', label: 'Hourglass' },
  { value: 'PEAR', label: 'Pear' },
  { value: 'APPLE', label: 'Apple' },
  { value: 'RECTANGLE', label: 'Rectangle' },
  { value: 'INVERTED_TRIANGLE', label: 'Inv. Triangle' },
] as const;

const UNIT_OPTIONS = [
  { value: 'METRIC' as const, label: 'Metric (cm/kg)' },
  { value: 'IMPERIAL' as const, label: 'Imperial (in/lbs)' },
] as const;

export default function MeasurementsScreen() {
  const router = useRouter();
  const { setMeasurements } = useOnboardingStore();

  const [gender, setGender] = useState<'M' | 'W' | null>(null);
  const [bodyShape, setBodyShape] = useState<string | null>(null);
  const [measurementUnit, setMeasurementUnit] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isMetric = measurementUnit === 'METRIC';
  const canProceed = gender !== null;

  function handleNext() {
    if (!canProceed) return;

    const heightNum = height ? parseFloat(height) : null;
    const weightNum = weight ? parseFloat(weight) : null;
    const waistNum = waist ? parseFloat(waist) : null;

    // Convert imperial to metric for storage
    const heightCm =
      heightNum !== null
        ? isMetric
          ? heightNum
          : Math.round(heightNum * 2.54 * 10) / 10
        : null;
    const weightKg =
      weightNum !== null
        ? isMetric
          ? weightNum
          : Math.round(weightNum * 0.453592 * 10) / 10
        : null;
    const waistCm =
      waistNum !== null
        ? isMetric
          ? waistNum
          : Math.round(waistNum * 2.54 * 10) / 10
        : null;

    setMeasurements({
      gender,
      heightCm,
      weightKg,
      waistCm,
      bodyShape,
      measurementUnit,
    });

    router.push('/onboarding/photos');
  }

  function renderGenderCard(value: 'W' | 'M', label: string, icon: string) {
    const selected = gender === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.genderCard,
          selected ? styles.genderCardSelected : styles.genderCardUnselected,
        ]}
        onPress={() => setGender(value)}
        activeOpacity={0.7}
      >
        <Text style={styles.genderIcon}>{icon}</Text>
        <Text
          style={[
            styles.genderLabel,
            { color: selected ? COLORS.navy : COLORS.white },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderChip(
    label: string,
    value: string,
    selectedValue: string | null,
    onSelect: (v: string) => void,
  ) {
    const selected = selectedValue === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
        ]}
        onPress={() => onSelect(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            selected ? styles.chipTextSelected : styles.chipTextUnselected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderUnitChip(value: 'METRIC' | 'IMPERIAL', label: string) {
    const selected = measurementUnit === value;
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.chip,
          selected ? styles.chipSelected : styles.chipUnselected,
        ]}
        onPress={() => setMeasurementUnit(value)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            selected ? styles.chipTextSelected : styles.chipTextUnselected,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderInput(
    label: string,
    unit: string,
    value: string,
    onChangeText: (t: string) => void,
    fieldName: string,
  ) {
    const isFocused = focusedField === fieldName;
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {label}{' '}
          <Text style={styles.inputUnit}>({unit})</Text>
        </Text>
        <TextInput
          style={[
            styles.textInput,
            isFocused && styles.textInputFocused,
          ]}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={COLORS.gray400}
          onFocus={() => setFocusedField(fieldName)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Indicator */}
          <Text style={styles.stepIndicator}>Step 1 of 4</Text>

          {/* Heading */}
          <Text style={styles.heading}>About You</Text>
          <Text style={styles.subheading}>
            Tell us about yourself to personalize your experience
          </Text>

          {/* Gender Selection */}
          <Text style={styles.sectionLabel}>I'm shopping for:</Text>
          <View style={styles.genderRow}>
            {renderGenderCard('W', "Women's", '👗')}
            {renderGenderCard('M', "Men's", '👔')}
          </View>

          {/* Body Shape */}
          <Text style={styles.sectionLabel}>Body Shape</Text>
          <View style={styles.chipRow}>
            {BODY_SHAPES.map((shape) =>
              renderChip(shape.label, shape.value, bodyShape, setBodyShape),
            )}
          </View>

          {/* Measurement Unit */}
          <Text style={styles.sectionLabel}>Measurements</Text>
          <View style={styles.chipRow}>
            {UNIT_OPTIONS.map((opt) => renderUnitChip(opt.value, opt.label))}
          </View>

          {/* Measurement Inputs */}
          {renderInput(
            'Height',
            isMetric ? 'cm' : 'in',
            height,
            setHeight,
            'height',
          )}
          {renderInput(
            'Weight',
            isMetric ? 'kg' : 'lbs',
            weight,
            setWeight,
            'weight',
          )}
          {renderInput(
            'Waist',
            isMetric ? 'cm' : 'in',
            waist,
            setWaist,
            'waist',
          )}

          {/* Spacer for button */}
          <View style={{ height: SPACING['3xl'] }} />
        </ScrollView>

        {/* Next Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed && styles.nextButtonDisabled,
              canProceed && SHADOWS.tealButton,
            ]}
            onPress={handleNext}
            disabled={!canProceed}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  scrollContent: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  stepIndicator: {
    ...TYPE.bodySm,
    color: COLORS.tealBright,
    marginBottom: SPACING.xl,
  },
  heading: {
    ...TYPE.headingXl,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPE.bodyMd,
    color: COLORS.gray400,
    marginBottom: SPACING['3xl'],
  },
  sectionLabel: {
    ...TYPE.headingMd,
    color: COLORS.white,
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  // Gender cards
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderCard: {
    flex: 1,
    height: 100,
    borderRadius: RADIUS.cardSm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderCardUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  genderCardSelected: {
    backgroundColor: 'rgba(72, 230, 205, 0.15)',
    borderWidth: 1.5,
    borderColor: COLORS.tealBright,
  },
  genderIcon: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  genderLabel: {
    ...TYPE.bodyLg,
    fontFamily: FONTS.semiBold,
  },
  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    height: COMPONENT.chipHeight,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipUnselected: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  chipSelected: {
    backgroundColor: COLORS.tealBright,
    borderWidth: 1.5,
    borderColor: COLORS.tealBright,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chipTextUnselected: {
    fontFamily: FONTS.medium,
    color: COLORS.gray500,
  },
  chipTextSelected: {
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
  },
  // Inputs
  inputGroup: {
    marginTop: SPACING.lg,
  },
  inputLabel: {
    ...TYPE.bodyMd,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontFamily: FONTS.medium,
  },
  inputUnit: {
    color: COLORS.gray400,
    fontFamily: FONTS.regular,
  },
  textInput: {
    height: COMPONENT.inputHeight,
    backgroundColor: COLORS.gray100,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.gray700,
  },
  textInputFocused: {
    borderColor: COLORS.tealBright,
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  nextButton: {
    height: COMPONENT.buttonHeight,
    backgroundColor: COLORS.tealBright,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },
});
