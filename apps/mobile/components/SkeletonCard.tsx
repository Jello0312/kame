// ═══════════════════════════════════════════════════════════════
// SkeletonCard — Shimmer placeholders for loading states
// ═══════════════════════════════════════════════════════════════
// Pulsing opacity animation (0.3 ↔ 0.7) using react-native-reanimated.
// Two variants:
//   SkeletonSwipeCard  — full-height card for explore loading
//   SkeletonFavoriteCard — grid card for favorites loading
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, COMPONENT, RADIUS, SPACING } from '../src/theme/constants';

// ── Shared pulse hook ─────────────────────────────────────────

function usePulse() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true, // reverse
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ── SkeletonSwipeCard ─────────────────────────────────────────
// Matches SwipeCard: flex-fills available space in the swipe deck area.
// Shows a rounded rect with 2 small bars at the bottom (title + price).

export function SkeletonSwipeCard() {
  const pulseStyle = usePulse();

  return (
    <Animated.View style={[styles.swipeCard, pulseStyle]}>
      {/* Bottom text area placeholder */}
      <View style={styles.swipeBottom}>
        <View style={styles.barLong} />
        <View style={styles.barShort} />
      </View>
    </Animated.View>
  );
}

// ── SkeletonFavoriteCard ──────────────────────────────────────
// Matches FavoriteCard: horizontal row with thumbnail + text bars.

export function SkeletonFavoriteCard() {
  const pulseStyle = usePulse();

  return (
    <Animated.View style={[styles.favCard, pulseStyle]}>
      {/* Thumbnail placeholder */}
      <View style={styles.favThumbnail} />
      {/* Text bars */}
      <View style={styles.favInfo}>
        <View style={styles.favBarName} />
        <View style={styles.favBarPrice} />
        <View style={styles.favBarBadge} />
      </View>
      {/* Right price placeholder */}
      <View style={styles.favBarRight} />
    </Animated.View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Swipe skeleton ──
  swipeCard: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
    borderRadius: RADIUS.card,
    marginHorizontal: COMPONENT.screenPadding,
    marginBottom: SPACING.lg,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  swipeBottom: {
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  barLong: {
    width: '60%',
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gray700,
  },
  barShort: {
    width: '35%',
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray700,
  },

  // ── Favorite skeleton ──
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  favThumbnail: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.badge,
    backgroundColor: COLORS.gray200,
  },
  favInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  favBarName: {
    width: '80%',
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gray200,
  },
  favBarPrice: {
    width: '50%',
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray200,
  },
  favBarBadge: {
    width: 50,
    height: 16,
    borderRadius: RADIUS.badge,
    backgroundColor: COLORS.gray200,
  },
  favBarRight: {
    width: 60,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gray200,
  },
});
