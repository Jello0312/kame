import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useOnboardingStore } from '../../stores/onboardingStore';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
  COMPONENT,
} from '../../src/theme/constants';

const BUDGET_OPTIONS = [
  { label: 'Under $50', value: 'BUDGET' },
  { label: '$50–$150', value: 'MID' },
  { label: '$150–$300', value: 'PREMIUM' },
  { label: '$300+', value: 'LUXURY' },
] as const;

const STYLE_OPTIONS = [
  'Casual',
  'Streetwear',
  'Formal',
  'Bohemian',
  'Sporty',
  'Minimalist',
] as const;

const PLATFORM_OPTIONS = [
  { label: 'Amazon', value: 'AMAZON' },
  { label: 'SHEIN', value: 'SHEIN' },
  { label: 'Zalora', value: 'ZALORA' },
  { label: 'ASOS', value: 'ASOS' },
  { label: 'Taobao', value: 'TAOBAO' },
] as const;

export function PreferencesStep() {
  const setPreferences = useOnboardingStore((s) => s.setPreferences);

  const [budgetRange, setBudgetRange] = useState<string | null>(null);
  const [fashionStyles, setFashionStyles] = useState<string[]>([]);
  const [preferredPlatforms, setPreferredPlatforms] = useState<string[]>([]);

  function toggleStyle(style: string) {
    const lower = style.toLowerCase();
    setFashionStyles((prev) =>
      prev.includes(lower) ? prev.filter((s) => s !== lower) : [...prev, lower],
    );
  }

  function togglePlatform(value: string) {
    setPreferredPlatforms((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value],
    );
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Heading */}
      <Text style={styles.heading}>Style Preferences</Text>
      <Text style={styles.subheading}>Help us find outfits you'll love</Text>

      {/* Budget Range */}
      <Text style={styles.sectionLabel}>Monthly Budget</Text>
      <View style={styles.chipRow}>
        {BUDGET_OPTIONS.map((option) => {
          const selected = budgetRange === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                setBudgetRange(option.value);
                setPreferences({
                  budgetRange: option.value,
                  fashionStyles,
                  preferredPlatforms,
                });
              }}
              activeOpacity={0.7}
              style={[
                styles.chip,
                selected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fashion Styles */}
      <Text style={styles.sectionLabel}>Styles You Love</Text>
      <View style={styles.chipRow}>
        {STYLE_OPTIONS.map((style) => {
          const selected = fashionStyles.includes(style.toLowerCase());
          return (
            <TouchableOpacity
              key={style}
              onPress={() => {
                toggleStyle(style);
                // Sync immediately
                const lower = style.toLowerCase();
                const next = fashionStyles.includes(lower)
                  ? fashionStyles.filter((s) => s !== lower)
                  : [...fashionStyles, lower];
                setPreferences({
                  budgetRange,
                  fashionStyles: next,
                  preferredPlatforms,
                });
              }}
              activeOpacity={0.7}
              style={[
                styles.chip,
                selected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {style}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Preferred Platforms */}
      <Text style={styles.sectionLabel}>Favorite Shops</Text>
      <View style={styles.chipRow}>
        {PLATFORM_OPTIONS.map((platform) => {
          const selected = preferredPlatforms.includes(platform.value);
          return (
            <TouchableOpacity
              key={platform.value}
              onPress={() => {
                togglePlatform(platform.value);
                const next = preferredPlatforms.includes(platform.value)
                  ? preferredPlatforms.filter((p) => p !== platform.value)
                  : [...preferredPlatforms, platform.value];
                setPreferences({
                  budgetRange,
                  fashionStyles,
                  preferredPlatforms: next,
                });
              }}
              activeOpacity={0.7}
              style={[
                styles.chip,
                selected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {platform.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: SPACING.lg }} />
    </ScrollView>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    height: COMPONENT.chipHeight,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.chip,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipUnselected: {
    borderColor: COLORS.gray200,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    borderColor: COLORS.tealBright,
    backgroundColor: COLORS.tealBright,
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
});
