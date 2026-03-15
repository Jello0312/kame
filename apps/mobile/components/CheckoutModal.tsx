// ═══════════════════════════════════════════════════════════════
// CheckoutModal — Lists all favorited products with shop links
// ═══════════════════════════════════════════════════════════════
// Opens from FavoritesScreen "Proceed to Checkout" button.
// Shows all products with individual "Shop" buttons that open
// each product page in an in-app browser.
// ═══════════════════════════════════════════════════════════════

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { ExternalLink, X } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnalyticsClick } from '../hooks/useAnalyticsClick';
import {
  COLORS,
  COMPONENT,
  FONTS,
  GRADIENTS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../src/theme/constants';
import type { FavoriteItem } from '../types/profile';

// ── Props ─────────────────────────────────────────────────────

interface CheckoutModalProps {
  visible: boolean;
  items: FavoriteItem[];
  onClose: () => void;
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

// ── Checkout Item Row ─────────────────────────────────────────

function CheckoutItem({
  item,
  onShop,
}: {
  item: FavoriteItem;
  onShop: (item: FavoriteItem) => void;
}) {
  return (
    <View style={styles.itemRow}>
      {/* Thumbnail */}
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={200}
      />

      {/* Info */}
      <View style={styles.itemInfo}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: getBadgeColor(item.platform) }]}>
            <Text style={styles.badgeText}>{item.platform}</Text>
          </View>
        </View>

        {item.brand != null && (
          <Text style={styles.itemBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}

        <View style={styles.itemBottomRow}>
          <Text style={styles.itemPrice}>
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
              style={styles.shopButtonGradient}
            >
              <Text style={styles.shopButtonText}>Shop</Text>
              <ExternalLink size={14} color={COLORS.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────

export function CheckoutModal({ visible, items, onClose }: CheckoutModalProps) {
  const trackClick = useAnalyticsClick();

  const handleShop = useCallback(
    async (item: FavoriteItem) => {
      trackClick(item.id, item.platform);
      await WebBrowser.openBrowserAsync(item.productPageUrl);
    },
    [trackClick],
  );

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const totalCurrency = items[0]?.currency ?? 'USD';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Checkout</Text>
          <Text style={styles.subtitle}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <X size={20} color={COLORS.navy} />
          </Pressable>
        </View>

        {/* Product List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((item) => (
            <CheckoutItem key={item.id} item={item} onShop={handleShop} />
          ))}
        </ScrollView>

        {/* Footer: Total + Info */}
        <View style={styles.footer}>
          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {formatPrice(total, totalCurrency)}
            </Text>
          </View>
          <Text style={styles.footerHint}>
            Tap "Shop" to open each product on its retailer
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0FAFB',
  },

  // Header
  header: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.navy,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.lg,
    right: COMPONENT.screenPadding,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  // Item Row
  itemRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    padding: SPACING.md,
    marginBottom: SPACING.md,
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
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  itemTopRow: {
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
  itemBrand: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  itemPrice: {
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

  // Shop Button
  shopButton: {
    borderRadius: RADIUS.button,
    overflow: 'hidden',
  },
  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.button,
    gap: 6,
    ...SHADOWS.ctaButton,
  },
  shopButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },

  // Footer
  footer: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  totalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.tealBright,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  totalLabel: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.navy,
  },
  totalAmount: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.navy,
  },
  footerHint: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
