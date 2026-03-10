import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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

const BUDGET_OPTIONS = [
  { label: 'Under $50', value: 'BUDGET' },
  { label: '$50\u2013$150', value: 'MID' },
  { label: '$150\u2013$300', value: 'PREMIUM' },
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

export default function PreferencesScreen() {
  const router = useRouter();
  const setPreferences = useOnboardingStore((s) => s.setPreferences);

  const [budgetRange, setBudgetRange] = useState('');
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

  function handleSubmit() {
    setPreferences({ budgetRange, fashionStyles, preferredPlatforms });
    router.push('/onboarding/generating');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: COMPONENT.screenPadding,
          paddingTop: SPACING['3xl'],
          paddingBottom: SPACING['4xl'],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator */}
        <Text
          style={{
            ...TYPE.bodySm,
            color: COLORS.tealBright,
            marginBottom: SPACING.sm,
          }}
        >
          Step 3 of 4
        </Text>

        {/* Heading */}
        <Text
          style={{
            ...TYPE.headingXl,
            color: COLORS.textPrimary,
            marginBottom: SPACING.sm,
          }}
        >
          Style Preferences
        </Text>

        {/* Subheading */}
        <Text
          style={{
            ...TYPE.bodyMd,
            color: COLORS.gray400,
            marginBottom: SPACING['3xl'],
          }}
        >
          Help us find outfits you'll love
        </Text>

        {/* Budget Range */}
        <Text
          style={{
            ...TYPE.headingMd,
            color: COLORS.textPrimary,
            marginBottom: SPACING.md,
          }}
        >
          Monthly Budget
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.sm,
            marginBottom: SPACING['3xl'],
          }}
        >
          {BUDGET_OPTIONS.map((option) => {
            const selected = budgetRange === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setBudgetRange(option.value)}
                activeOpacity={0.7}
                style={{
                  height: COMPONENT.chipHeight,
                  paddingHorizontal: SPACING.lg,
                  borderRadius: RADIUS.chip,
                  borderWidth: 1.5,
                  borderColor: selected ? COLORS.tealBright : COLORS.gray200,
                  backgroundColor: selected ? COLORS.tealBright : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: selected ? FONTS.semiBold : FONTS.medium,
                    fontSize: 14,
                    color: selected ? COLORS.navy : COLORS.gray500,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fashion Styles */}
        <Text
          style={{
            ...TYPE.headingMd,
            color: COLORS.textPrimary,
            marginBottom: SPACING.md,
          }}
        >
          Styles You Love
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.sm,
            marginBottom: SPACING['3xl'],
          }}
        >
          {STYLE_OPTIONS.map((style) => {
            const selected = fashionStyles.includes(style.toLowerCase());
            return (
              <TouchableOpacity
                key={style}
                onPress={() => toggleStyle(style)}
                activeOpacity={0.7}
                style={{
                  height: COMPONENT.chipHeight,
                  paddingHorizontal: SPACING.lg,
                  borderRadius: RADIUS.chip,
                  borderWidth: 1.5,
                  borderColor: selected ? COLORS.tealBright : COLORS.gray200,
                  backgroundColor: selected ? COLORS.tealBright : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: selected ? FONTS.semiBold : FONTS.medium,
                    fontSize: 14,
                    color: selected ? COLORS.navy : COLORS.gray500,
                  }}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preferred Platforms */}
        <Text
          style={{
            ...TYPE.headingMd,
            color: COLORS.textPrimary,
            marginBottom: SPACING.md,
          }}
        >
          Favorite Shops
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: SPACING.sm,
            marginBottom: SPACING['3xl'],
          }}
        >
          {PLATFORM_OPTIONS.map((platform) => {
            const selected = preferredPlatforms.includes(platform.value);
            return (
              <TouchableOpacity
                key={platform.value}
                onPress={() => togglePlatform(platform.value)}
                activeOpacity={0.7}
                style={{
                  height: COMPONENT.chipHeight,
                  paddingHorizontal: SPACING.lg,
                  borderRadius: RADIUS.chip,
                  borderWidth: 1.5,
                  borderColor: selected ? COLORS.tealBright : COLORS.gray200,
                  backgroundColor: selected ? COLORS.tealBright : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: selected ? FONTS.semiBold : FONTS.medium,
                    fontSize: 14,
                    color: selected ? COLORS.navy : COLORS.gray500,
                  }}
                >
                  {platform.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Generate My Styles Button — Coral Gradient CTA */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          style={{
            borderRadius: RADIUS.button,
            overflow: 'hidden',
            ...SHADOWS.ctaButton,
          }}
        >
          <LinearGradient
            colors={['#CC4968', '#FA6869']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              height: COMPONENT.buttonHeight,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontFamily: FONTS.semiBold,
                fontSize: 16,
              }}
            >
              Generate My Styles
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
