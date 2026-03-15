// ═══════════════════════════════════════════════════════════════
// FavoriteCard — Product card matching CheckoutItem layout
// ═══════════════════════════════════════════════════════════════
// Thumbnail | name + badge + brand | price + Shop button.
// Swipe left to reveal delete action. Tap Shop to open link.
// ═══════════════════════════════════════════════════════════════

import { useRef } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, Trash2 } from 'lucide-react-native';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import {
  COLORS,
  FONTS,
  GRADIENTS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../src/theme/constants';
import type { FavoriteItem } from '../types/profile';

// ── Props ─────────────────────────────────────────────────────

interface FavoriteCardProps {
  item: FavoriteItem;
  onShop: (item: FavoriteItem) => void;
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

export function FavoriteCard({ item, onShop, onRemove }: FavoriteCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        swipeableRef.current?.close();
        onRemove(item);
      }}
      style={styles.deleteAction}
    >
      <Trash2 size={22} color={COLORS.white} />
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <View style={styles.card}>
        {/* Thumbnail */}
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.platform !== '' && (
              <View style={[styles.badge, { backgroundColor: getBadgeColor(item.platform) }]}>
                <Text style={styles.badgeText}>{item.platform}</Text>
              </View>
            )}
          </View>

          {item.brand != null && item.brand !== '' && (
            <Text style={styles.brand} numberOfLines={1}>
              {item.brand}
            </Text>
          )}

          <View style={styles.bottomRow}>
            <Text style={styles.price}>
              {formatPrice(item.price, item.currency)}
            </Text>

            <Pressable
              onPress={() => onShop(item)}
              style={({ pressed }) => [
                styles.shopButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={GRADIENTS.cta as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shopGradient}
              >
                <Text style={styles.shopText}>Shop</Text>
                <ExternalLink size={14} color={COLORS.white} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  thumbnail: {
    width: 72,
    height: 96,
    borderRadius: RADIUS.badge,
    backgroundColor: COLORS.gray100,
  },

  info: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.navy,
  },
  brand: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.coral,
  },

  // Badge
  badge: {
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

  // Shop button
  shopButton: {
    borderRadius: RADIUS.button,
    overflow: 'hidden',
  },
  shopGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.button,
    gap: 6,
    ...SHADOWS.ctaButton,
  },
  shopText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },

  // Swipe-to-delete action
  deleteAction: {
    backgroundColor: COLORS.coral,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopRightRadius: RADIUS.input,
    borderBottomRightRadius: RADIUS.input,
    paddingHorizontal: SPACING.md,
  },
  deleteText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    marginTop: 4,
  },
});
