// ═══════════════════════════════════════════════════════════════
// SkeletonCard — Shimmer placeholders for loading states
// ═══════════════════════════════════════════════════════════════
// Pulsing opacity animation (0.3 ↔ 0.7) using react-native-reanimated.
// Two variants:
//   SkeletonSwipeCard  — full-height card for explore loading
//   SkeletonFavoriteCard — grid card for favorites loading
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
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
// Matches FavoriteCard: half-screen width, 3:4 aspect image + footer.

export function SkeletonFavoriteCard() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - COMPONENT.screenPadding * 2 - SPACING.md) / 2;
  const pulseStyle = usePulse();

  return (
    <Animated.View style={[styles.favCard, { width: cardWidth }, pulseStyle]}>
      {/* Image placeholder */}
      <View style={[styles.favImage, { width: cardWidth }]} />
      {/* Footer text placeholders */}
      <View style={styles.favFooter}>
        <View style={styles.favBarName} />
        <View style={styles.favBarPrice} />
      </View>
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
    backgroundColor: COLORS.navyDeep,
    borderRadius: RADIUS.cardSm,
    overflow: 'hidden',
  },
  favImage: {
    aspectRatio: 3 / 4,
    backgroundColor: COLORS.gray700,
  },
  favFooter: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  favBarName: {
    width: '70%',
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray700,
  },
  favBarPrice: {
    width: '40%',
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.gray700,
  },
});
