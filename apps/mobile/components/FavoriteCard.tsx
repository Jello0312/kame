// ═══════════════════════════════════════════════════════════════
// FavoriteCard — Horizontal product card for favorites list
// ═══════════════════════════════════════════════════════════════
// Shopping-cart-style row: thumbnail | name + price + badge | price + delete.
// White card on light background. Tap opens ProductDetailModal,
// delete button triggers unfavorite callback.
// ═══════════════════════════════════════════════════════════════

import { Image } from 'expo-image';
import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  COLORS,
  FONTS,
  RADIUS,
  SPACING,
} from '../src/theme/constants';
import type { FavoriteItem } from '../types/profile';

// ── Props ─────────────────────────────────────────────────────

interface FavoriteCardProps {
  item: FavoriteItem;
  onPress: (item: FavoriteItem) => void;
  onRemove: (item: FavoriteItem) => void;
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

export function FavoriteCard({ item, onPress, onRemove }: FavoriteCardProps) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.9 },
      ]}
    >
      {/* Product Thumbnail */}
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />

      {/* Center: Name + per-item price + badge */}
      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.perItemPrice}>
          {formatPrice(item.price, item.currency)} per item
        </Text>
        {item.platform !== '' && (
          <View style={[styles.badge, { backgroundColor: getBadgeColor(item.platform) }]}>
            <Text style={styles.badgeText}>{item.platform}</Text>
          </View>
        )}
      </View>

      {/* Right: Price + Delete */}
      <View style={styles.rightColumn}>
        <Text style={styles.price}>
          {formatPrice(item.price, item.currency)}
        </Text>
        <Pressable
          onPress={() => onRemove(item)}
          hitSlop={8}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Trash2 size={20} color={COLORS.coral} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    padding: SPACING.md,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.badge,
    backgroundColor: COLORS.gray100,
  },

  info: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.navy,
    lineHeight: 20,
  },
  perItemPrice: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.gray500,
    marginTop: 2,
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.badge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 9,
    textTransform: 'uppercase',
  },

  rightColumn: {
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.navy,
  },
  deleteButton: {
    padding: 4,
  },
});
