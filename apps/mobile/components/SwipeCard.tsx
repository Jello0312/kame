// ═══════════════════════════════════════════════════════════════
// SwipeCard — Pure presentational card for the swipe feed
// ═══════════════════════════════════════════════════════════════
// Renders a single outfit/dress card with product info overlay,
// platform badge, and animated LIKE/NOPE stamps during drag.
// ═══════════════════════════════════════════════════════════════

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { COLORS, FONTS, GRADIENTS, RADIUS, SPACING } from '../src/theme/constants';
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

// ── LIKE / NOPE Stamps ────────────────────────────────────────

function LikeStamp({ translationX }: { translationX: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translationX.value, [0, 120], [0, 1], 'clamp'),
  }));

  return (
    <Animated.View style={[styles.stamp, styles.stampLike, animatedStyle]}>
      <Text style={[styles.stampText, { color: COLORS.green, borderColor: COLORS.green }]}>
        LIKE
      </Text>
    </Animated.View>
  );
}

function NopeStamp({ translationX }: { translationX: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translationX.value, [-120, 0], [1, 0], 'clamp'),
  }));

  return (
    <Animated.View style={[styles.stamp, styles.stampNope, animatedStyle]}>
      <Text style={[styles.stampText, { color: COLORS.red, borderColor: COLORS.red }]}>
        NOPE
      </Text>
    </Animated.View>
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

export function SwipeCard({ card, isTop, translationX }: SwipeCardProps) {
  const imageUrl = getCardImageUrl(card);
  const platform = getPlatform(card);
  const showGenerating = !card.tryOnImageUrl;

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

      {/* 6. LIKE / NOPE Stamps */}
      {isTop && translationX != null && (
        <>
          <LikeStamp translationX={translationX} />
          <NopeStamp translationX={translationX} />
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

  // Stamp shared
  stamp: {
    position: 'absolute',
    top: 40,
    zIndex: 5,
  },
  stampLike: {
    left: SPACING.xl,
    transform: [{ rotate: '-15deg' }],
  },
  stampNope: {
    right: SPACING.xl,
    transform: [{ rotate: '15deg' }],
  },
  stampText: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    borderWidth: 3,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
