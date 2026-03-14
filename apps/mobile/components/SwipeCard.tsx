// ═══════════════════════════════════════════════════════════════
// SwipeCard — Pure presentational card for the swipe feed
// ═══════════════════════════════════════════════════════════════
// Renders a single outfit/dress card with product info overlay,
// platform badge, and animated glow + icon feedback during drag.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Heart, X } from 'lucide-react-native';

import { COLORS, FONTS, GRADIENTS, RADIUS, SPACING, SWIPE } from '../src/theme/constants';
import type { FeedCard } from '../types/feed';

// ── Props ─────────────────────────────────────────────────────

interface SwipeCardProps {
  card: FeedCard;
  isTop: boolean;
  translationX?: SharedValue<number>;
}

// ── Helpers ───────────────────────────────────────────────────

function getCardImageUrl(card: FeedCard): string | null {
  if (card.tryOnImageUrl) return card.tryOnImageUrl;
  if (card.isSolo && card.soloProduct) return card.soloProduct.imageUrl;
  if (!card.isSolo && card.topProduct) return card.topProduct.imageUrl;
  return null;
}

function formatPrice(price: number, currency: string): string {
  return currency === 'USD' ? `$${price.toFixed(2)}` : `${currency} ${price.toFixed(2)}`;
}

function getPlatform(card: FeedCard): string {
  if (card.isSolo && card.soloProduct) return card.soloProduct.platform;
  if (card.topProduct) return card.topProduct.platform;
  return '';
}

function getBadgeColor(platform: string): string {
  if (platform === 'AMAZON') return COLORS.amazon;
  if (platform === 'SHEIN') return COLORS.shein;
  return COLORS.gray500;
}

// ── Swipe Glow Overlay ──────────────────────────────────────

function SwipeGlowOverlay({ translationX }: { translationX: SharedValue<number> }) {
  const likeGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translationX.value, [0, SWIPE.threshold], [0, 1], 'clamp'),
  }));

  const dislikeGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translationX.value, [-SWIPE.threshold, 0], [1, 0], 'clamp'),
  }));

  return (
    <>
      <Animated.View style={[styles.glowContainer, likeGlowStyle]} pointerEvents="none">
        <LinearGradient
          colors={GRADIENTS.glowLike as unknown as [string, string]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0.3 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Animated.View style={[styles.glowContainer, dislikeGlowStyle]} pointerEvents="none">
        <LinearGradient
          colors={GRADIENTS.glowDislike as unknown as [string, string]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0.3 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </>
  );
}

// ── Swipe Icon Overlay ──────────────────────────────────────

function SwipeIconOverlay({ translationX }: { translationX: SharedValue<number> }) {
  const likeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translationX.value, [0, 80], [0, 1], 'clamp'),
    transform: [
      { scale: interpolate(translationX.value, [0, SWIPE.threshold], [0.5, 1], 'clamp') },
    ],
  }));

  const dislikeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translationX.value, [-80, 0], [1, 0], 'clamp'),
    transform: [
      { scale: interpolate(translationX.value, [-SWIPE.threshold, 0], [1, 0.5], 'clamp') },
    ],
  }));

  return (
    <>
      <Animated.View style={[styles.iconOverlay, likeIconStyle]} pointerEvents="none">
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(40, 155, 98, 0.85)' }]}>
          <Heart size={32} color={COLORS.white} fill={COLORS.white} />
        </View>
      </Animated.View>
      <Animated.View style={[styles.iconOverlay, dislikeIconStyle]} pointerEvents="none">
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(227, 57, 60, 0.85)' }]}>
          <X size={32} color={COLORS.white} strokeWidth={2.5} />
        </View>
      </Animated.View>
    </>
  );
}
// ── Product Info: Outfit Pair ─────────────────────────────────

function OutfitPairInfo({ card }: { card: FeedCard }) {
  const { topProduct, bottomProduct, totalPrice } = card;
  if (!topProduct || !bottomProduct) return null;

  return (
    <View>
      {/* Top product */}
      <Text style={styles.productName} numberOfLines={1}>
        {topProduct.name}
      </Text>
      <Text style={styles.productPrice}>
        {formatPrice(topProduct.price, topProduct.currency)}
      </Text>

      {/* Teal divider */}
      <View style={styles.divider} />

      {/* Bottom product */}
      <Text style={styles.productName} numberOfLines={1}>
        {bottomProduct.name}
      </Text>
      <Text style={styles.productPrice}>
        {formatPrice(bottomProduct.price, bottomProduct.currency)}
      </Text>

      {/* Total */}
      <Text style={styles.totalPrice}>
        Total: ${totalPrice.toFixed(2)}
      </Text>
    </View>
  );
}

// ── Product Info: Solo Dress ──────────────────────────────────

function SoloProductInfo({ card }: { card: FeedCard }) {
  const { soloProduct } = card;
  if (!soloProduct) return null;

  return (
    <View>
      <Text style={styles.soloName} numberOfLines={1}>
        {soloProduct.name}
      </Text>
      <Text style={styles.soloPrice}>
        {formatPrice(soloProduct.price, soloProduct.currency)}
      </Text>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────

const GENERATING_TIMEOUT_MS = 30_000;

export function SwipeCard({ card, isTop, translationX }: SwipeCardProps) {
  const imageUrl = getCardImageUrl(card);
  const platform = getPlatform(card);

  // Show "Generating..." overlay, but auto-dismiss after timeout
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (card.tryOnImageUrl) return;
    setTimedOut(false);
    const timer = setTimeout(() => setTimedOut(true), GENERATING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [card.tryOnImageUrl]);

  const showGenerating = !card.tryOnImageUrl && !timedOut;

  return (
    <Animated.View style={styles.card}>
      {/* 1. Background Image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.navyDeep }]} />
      )}

      {/* 2. Generating Overlay */}
      {showGenerating && (
        <View style={styles.generatingOverlay}>
          <ActivityIndicator size="large" color={COLORS.tealBright} />
          <Text style={styles.generatingText}>Generating your look...</Text>
        </View>
      )}

      {/* 3. Platform Badge */}
      {platform !== '' && (
        <View style={[styles.badge, { backgroundColor: getBadgeColor(platform) }]}>
          <Text style={styles.badgeText}>{platform}</Text>
        </View>
      )}

      {/* 4. Bottom Gradient */}
      <LinearGradient
        colors={GRADIENTS.cardOverlay as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      />

      {/* 5. Product Info */}
      <View style={styles.infoContainer}>
        {card.isSolo ? (
          <SoloProductInfo card={card} />
        ) : (
          <OutfitPairInfo card={card} />
        )}
      </View>

      {/* 6. Swipe Glow + Icon Feedback */}
      {isTop && translationX != null && (
        <>
          <SwipeGlowOverlay translationX={translationX} />
          <SwipeIconOverlay translationX={translationX} />
        </>
      )}
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    backgroundColor: COLORS.navyDeep,
  },

  // Generating overlay
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,40,54,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  generatingText: {
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontSize: 14,
    marginTop: SPACING.md,
  },

  // Platform badge
  badge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 3,
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },

  // Bottom gradient
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 1,
  },

  // Product info container
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    zIndex: 4,
  },

  // Outfit pair styles
  productName: {
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontSize: 15,
  },
  productPrice: {
    color: COLORS.coral,
    fontFamily: FONTS.bold,
    fontSize: 15,
  },
  divider: {
    height: 1,
    width: 40,
    backgroundColor: COLORS.tealBright,
    marginVertical: SPACING.sm,
  },
  totalPrice: {
    color: COLORS.tealBright,
    fontFamily: FONTS.bold,
    fontSize: 18,
    marginTop: SPACING.sm,
  },

  // Solo product styles
  soloName: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 17,
  },
  soloPrice: {
    color: COLORS.coral,
    fontFamily: FONTS.bold,
    fontSize: 20,
  },

  // Glow overlay (covers bottom 60% of card)
  glowContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    zIndex: 2,
    borderBottomLeftRadius: RADIUS.card,
    borderBottomRightRadius: RADIUS.card,
    overflow: 'hidden',
  },

  // Icon overlay (centered in card)
  iconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
  },

  // Circular icon background
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
