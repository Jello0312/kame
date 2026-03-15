import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, LogOut, User } from 'lucide-react-native';

import { AuthBackground } from '../../components/AuthBackground';
import { ProfileSection } from '../../components/ProfileSection';
import { KameLogo } from '../../components/KameLogo';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  COMPONENT,
} from '../../src/theme/constants';
import type {
  UserMe,
  UserProfile,
  UserAvatar,
  StylePreferences,
} from '../../types/profile';

// ─── Helpers ──────────────────────────────────────────────────

function formatHeight(cm: number | null, unit: 'METRIC' | 'IMPERIAL'): string {
  if (cm == null) return '\u2014';
  if (unit === 'IMPERIAL') {
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

function formatWeight(kg: number | null, unit: 'METRIC' | 'IMPERIAL'): string {
  if (kg == null) return '\u2014';
  if (unit === 'IMPERIAL') return `${Math.round(kg / 0.4536)} lbs`;
  return `${Math.round(kg)} kg`;
}

function formatWaist(cm: number | null, unit: 'METRIC' | 'IMPERIAL'): string {
  if (cm == null) return '\u2014';
  if (unit === 'IMPERIAL') return `${Math.round(cm / 2.54)}"`;
  return `${Math.round(cm)} cm`;
}

function formatBodyShape(shape: string | null): string {
  if (!shape) return '\u2014';
  // INVERTED_TRIANGLE -> "Inverted triangle"
  return shape.charAt(0) + shape.slice(1).toLowerCase().replace(/_/g, ' ');
}

function formatBudget(budget: string): string {
  switch (budget) {
    case 'BUDGET':
      return 'Budget-Friendly';
    case 'MID':
      return 'Mid-Range';
    case 'PREMIUM':
      return 'Premium';
    case 'LUXURY':
      return 'Luxury';
    default:
      return budget;
  }
}

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Local Components ─────────────────────────────────────────

function ReadOnlyChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function MeasurementCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.measurementCard}>
      <Text style={styles.measurementLabel}>{label}</Text>
      <Text style={styles.measurementValue}>{value}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ProfileScreen() {
  // ── Data Queries ──────────────────────────────────────────

  const meQuery = useQuery<UserMe>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<UserMe>('/auth/me');
      return res.data!;
    },
  });

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get<UserProfile>('/api/profile');
      return res.data!;
    },
  });

  const avatarQuery = useQuery<UserAvatar>({
    queryKey: ['avatar'],
    queryFn: async () => {
      const res = await api.get<UserAvatar>('/api/avatar');
      return res.data!;
    },
  });

  const prefsQuery = useQuery<StylePreferences>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const res = await api.get<StylePreferences>('/api/preferences');
      return res.data!;
    },
  });

  // ── Handlers ──────────────────────────────────────────────

  const handleLogout = useCallback(() => {
    useAuthStore.getState().logout();
    // Root _layout.tsx watches isAuthenticated and auto-redirects to /auth/login
  }, []);

  const handleFeedback = useCallback(async () => {
    await WebBrowser.openBrowserAsync('https://docs.google.com/forms/d/1s5PfWv4gw-jMEFfzG9KWdt1Cl_EGPIrev4Ua8MX-4Vw/viewform');
  }, []);

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AuthBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 1. Header ───────────────────────────────────── */}
        <View style={styles.header}>
          <KameLogo />

          {meQuery.isLoading ? (
            <View style={styles.headerPlaceholders}>
              <View style={styles.namePlaceholder} />
              <View style={styles.emailPlaceholder} />
            </View>
          ) : meQuery.data ? (
            <>
              <Text style={styles.userName}>{meQuery.data.name}</Text>
              <Text style={styles.userEmail}>{meQuery.data.email}</Text>
            </>
          ) : null}
        </View>

        {/* ── 2. Divider ──────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── 3. Shopping For ─────────────────────────────── */}
        <ProfileSection title="Shopping For">
          {profileQuery.isLoading ? (
            <ActivityIndicator color={COLORS.tealBright} size="small" />
          ) : profileQuery.data ? (
            <View style={styles.chipSelfStart}>
              <ReadOnlyChip
                label={
                  profileQuery.data.gender === 'W'
                    ? "Women's Fashion"
                    : "Men's Fashion"
                }
              />
            </View>
          ) : null}
        </ProfileSection>

        {/* ── 4. Measurements ─────────────────────────────── */}
        <ProfileSection title="Measurements">
          {profileQuery.isLoading ? (
            <ActivityIndicator color={COLORS.tealBright} size="small" />
          ) : profileQuery.data ? (
            <>
              <View style={styles.measurementRow}>
                <MeasurementCard
                  label="Height"
                  value={formatHeight(
                    profileQuery.data.heightCm,
                    profileQuery.data.measurementUnit,
                  )}
                />
                <MeasurementCard
                  label="Weight"
                  value={formatWeight(
                    profileQuery.data.weightKg,
                    profileQuery.data.measurementUnit,
                  )}
                />
              </View>
              <View style={styles.measurementRowSpaced}>
                <MeasurementCard
                  label="Waist"
                  value={formatWaist(
                    profileQuery.data.waistCm,
                    profileQuery.data.measurementUnit,
                  )}
                />
                <MeasurementCard
                  label="Body Shape"
                  value={formatBodyShape(profileQuery.data.bodyShape)}
                />
              </View>
            </>
          ) : null}
        </ProfileSection>

        {/* ── 5. Your Photos ──────────────────────────────── */}
        <ProfileSection title="Your Photos">
          {avatarQuery.isLoading ? (
            <ActivityIndicator color={COLORS.tealBright} size="small" />
          ) : avatarQuery.data ? (
            <View style={styles.photosRow}>
              {/* Face photo */}
              <View style={styles.facePhotoContainer}>
                {avatarQuery.data.facePhotoUrl ? (
                  <Image
                    source={{ uri: avatarQuery.data.facePhotoUrl }}
                    style={styles.facePhoto}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <User size={32} color={COLORS.gray500} />
                  </View>
                )}
              </View>

              {/* Body photo */}
              <View style={styles.bodyPhotoContainer}>
                {avatarQuery.data.bodyPhotoUrl ? (
                  <Image
                    source={{ uri: avatarQuery.data.bodyPhotoUrl }}
                    style={styles.bodyPhoto}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <User size={32} color={COLORS.gray500} />
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </ProfileSection>

        {/* ── 6. Style Preferences ────────────────────────── */}
        <ProfileSection title="Style Preferences">
          {prefsQuery.isLoading ? (
            <ActivityIndicator color={COLORS.tealBright} size="small" />
          ) : prefsQuery.data ? (
            <>
              {/* Budget */}
              <Text style={styles.prefLabel}>Budget</Text>
              <View style={styles.chipRow}>
                <ReadOnlyChip label={formatBudget(prefsQuery.data.budgetRange)} />
              </View>

              {/* Styles */}
              <Text style={styles.prefLabelSpaced}>Styles</Text>
              <View style={styles.chipRow}>
                {prefsQuery.data.fashionStyles.map((s) => (
                  <ReadOnlyChip key={s} label={capitalize(s)} />
                ))}
              </View>

              {/* Platforms */}
              <Text style={styles.prefLabelSpaced}>Platforms</Text>
              <View style={styles.chipRow}>
                {prefsQuery.data.preferredPlatforms.map((p) => (
                  <ReadOnlyChip key={p} label={p} />
                ))}
              </View>
            </>
          ) : null}
        </ProfileSection>

        {/* ── 7. Action Buttons ───────────────────────────── */}
        <View style={styles.actionsContainer}>
          {/* Give Feedback — teal solid */}
          <Pressable onPress={handleFeedback}>
            <View style={styles.feedbackButton}>
              <MessageSquare
                size={20}
                color={COLORS.navy}
                style={styles.buttonIcon}
              />
              <Text style={styles.feedbackButtonText}>Give Feedback</Text>
            </View>
          </Pressable>

          {/* Log Out — ghost/outline */}
          <Pressable onPress={handleLogout} style={styles.logoutPressable}>
            <View style={styles.logoutButton}>
              <LogOut
                size={20}
                color={COLORS.tealBright}
                style={styles.buttonIcon}
              />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </View>
          </Pressable>
        </View>

        {/* ── 8. Footer ──────────────────────────────────── */}
        <Text style={styles.footer}>Kame v0.1.0-beta</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0FAFB',
  },
  scrollContent: {
    paddingBottom: SPACING['4xl'],
  },

  // Header
  header: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.md,
  },
  headerPlaceholders: {
    marginTop: SPACING.xl,
  },
  namePlaceholder: {
    height: 28,
    width: 160,
    backgroundColor: COLORS.gray200,
    borderRadius: 8,
  },
  emailPlaceholder: {
    height: 16,
    width: 200,
    backgroundColor: COLORS.gray200,
    borderRadius: 6,
    marginTop: SPACING.sm,
  },
  userName: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.navy,
    marginTop: SPACING.xl,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: SPACING.xl,
    marginHorizontal: COMPONENT.screenPadding,
  },

  // Shopping For
  chipSelfStart: {
    alignSelf: 'flex-start',
  },

  // Measurements
  measurementRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  measurementRowSpaced: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  measurementCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.cardSm,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  measurementLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.gray500,
  },
  measurementValue: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
    marginTop: SPACING.xs,
  },

  // Photos
  photosRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  facePhotoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
  },
  facePhoto: {
    width: 80,
    height: 80,
  },
  bodyPhotoContainer: {
    width: 80,
    height: 107,
    borderRadius: RADIUS.input,
    overflow: 'hidden',
    backgroundColor: COLORS.gray100,
  },
  bodyPhoto: {
    width: 80,
    height: 107,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Preferences
  prefLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  prefLabelSpaced: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.gray500,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  // Chips
  chip: {
    backgroundColor: COLORS.tealBright,
    borderRadius: RADIUS.chip,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.navy,
  },

  // Action Buttons
  actionsContainer: {
    paddingHorizontal: COMPONENT.screenPadding,
    marginTop: SPACING['3xl'],
  },
  feedbackButton: {
    backgroundColor: COLORS.tealBright,
    height: COMPONENT.buttonHeight,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },
  logoutPressable: {
    marginTop: SPACING.md,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.tealBright,
    height: COMPONENT.buttonHeight,
    borderRadius: RADIUS.button,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.tealBright,
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },

  // Footer
  footer: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING['2xl'],
  },
});
