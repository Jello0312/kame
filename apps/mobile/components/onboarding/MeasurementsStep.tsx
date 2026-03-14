import { useState, useEffect } from 'react';
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
import { useOnboardingStore } from '../../stores/onboardingStore';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
  COMPONENT,
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

interface MeasurementsStepProps {
  onValidChange: (isValid: boolean) => void;
}

export function MeasurementsStep({ onValidChange }: MeasurementsStepProps) {
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

  // Notify parent of validity changes
  useEffect(() => {
    onValidChange(canProceed);
  }, [canProceed, onValidChange]);

  // Save data to store whenever values change
  useEffect(() => {
    if (!gender) return;
    const heightNum = height ? parseFloat(height) : null;
    const weightNum = weight ? parseFloat(weight) : null;
    const waistNum = waist ? parseFloat(waist) : null;

    const heightCm =
      heightNum !== null
        ? isMetric ? heightNum : Math.round(heightNum * 2.54 * 10) / 10
        : null;
    const weightKg =
      weightNum !== null
        ? isMetric ? weightNum : Math.round(weightNum * 0.453592 * 10) / 10
        : null;
    const waistCm =
      waistNum !== null
        ? isMetric ? waistNum : Math.round(waistNum * 2.54 * 10) / 10
        : null;

    setMeasurements({ gender, heightCm, weightKg, waistCm, bodyShape, measurementUnit });
  }, [gender, bodyShape, measurementUnit, height, weight, waist, isMetric, setMeasurements]);

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
          style={[styles.textInput, isFocused && styles.textInputFocused]}
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
        {renderInput('Height', isMetric ? 'cm' : 'in', height, setHeight, 'height')}
        {renderInput('Weight', isMetric ? 'kg' : 'lbs', weight, setWeight, 'weight')}
        {renderInput('Waist', isMetric ? 'cm' : 'in', waist, setWaist, 'waist')}

        <View style={{ height: SPACING.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingBottom: SPACING.lg,
  },
  heading: {
    ...TYPE.headingXl,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPE.bodyMd,
    color: COLORS.gray400,
    marginBottom: SPACING['2xl'],
  },
  sectionLabel: {
    ...TYPE.headingMd,
    color: COLORS.white,
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
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
});
