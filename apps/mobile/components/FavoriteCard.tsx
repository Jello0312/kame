// ═══════════════════════════════════════════════════════════════
// FavoriteCard — Pure presentational card for the favorites grid
// ═══════════════════════════════════════════════════════════════
// Renders a single favorite product as a compact 2-column card
// with image, product info, price (coral), and platform badge.
// ═══════════════════════════════════════════════════════════════

import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  COLORS,
  COMPONENT,
  FONTS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../src/theme/constants';
import type { FavoriteItem } from '../types/profile';

// ── Props ─────────────────────────────────────────────────────

interface FavoriteCardProps {
  item: FavoriteItem;
  onPress: (item: FavoriteItem) => void;
}

// ── Helpers ───────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  return currency === 'USD' ? `$${price.toFixed(2)}` : `${currency} ${price.toFixed(2)}`;
}

function getBadgeColor(platform: string): string {
  if (platform === 'AMAZON') return COLORS.amazon;
  if (platform === 'SHEIN') return COLORS.shein;
  return COLORS.gray500;
}

// ── Component ─────────────────────────────────────────────────

export function FavoriteCard({ item, onPress }: FavoriteCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - COMPONENT.screenPadding * 2 - SPACING.md) / 2;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Product Image */}
      <Image
        source={{ uri: item.imageUrl }}
        style={[styles.image, { width: cardWidth }]}
        contentFit="cover"
        transition={200}
        placeholder={{ blurhash: undefined }}
        placeholderContentFit="cover"
      />

      {/* Platform Badge */}
      {item.platform !== '' && (
        <View style={[styles.badge, { backgroundColor: getBadgeColor(item.platform) }]}>
          <Text style={styles.badgeText}>{item.platform}</Text>
        </View>
      )}

      {/* Card Footer */}
      <View style={styles.footer}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.brand != null && (
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
        <Text style={styles.price}>
          {formatPrice(item.price, item.currency)}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.cardSm,
    overflow: 'hidden',
    backgroundColor: COLORS.navyDeep,
    ...SHADOWS.card,
  },

  image: {
    aspectRatio: 3 / 4,
    backgroundColor: COLORS.navyDeep,
  },

  // Platform badge
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    borderRadius: RADIUS.badge,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 9,
    textTransform: 'uppercase',
  },

  // Footer
  footer: {
    backgroundColor: COLORS.navyDeep,
    padding: SPACING.md,
  },
  productName: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.white,
  },
  brand: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.coral,
    marginTop: SPACING.xs,
  },
});
