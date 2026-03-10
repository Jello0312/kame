// ═══════════════════════════════════════════════════════════════
// ProductDetailModal — Full-screen product detail sheet
// ═══════════════════════════════════════════════════════════════
// Opens from FavoritesScreen when a FavoriteCard is tapped.
// Shows hero image, product info, and a coral-gradient "Buy Now"
// CTA that opens the product page in an in-app browser.
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

interface ProductDetailModalProps {
  product: FavoriteItem | null;
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

// ── Component ─────────────────────────────────────────────────

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const trackClick = useAnalyticsClick();

  const handleBuyNow = useCallback(async () => {
    if (!product) return;
    trackClick(product.id, product.platform); // fire-and-forget
    await WebBrowser.openBrowserAsync(product.productPageUrl);
  }, [product, trackClick]);

  return (
    <Modal
      visible={!!product}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {product == null ? null : (
        <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
          {/* Close Button */}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={8}
          >
            <X size={22} color={COLORS.white} />
          </Pressable>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Image Container */}
            <View style={styles.heroContainer}>
              <Image
                source={{ uri: product.imageUrl }}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
              />

              {/* Gradient Overlay */}
              <LinearGradient
                colors={GRADIENTS.cardOverlay as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.heroGradient}
              />
            </View>

            {/* Content Below Image */}
            <View style={styles.content}>
              {/* Platform Badge (inline) */}
              <View style={[styles.badge, { backgroundColor: getBadgeColor(product.platform) }]}>
                <Text style={styles.badgeText}>{product.platform}</Text>
              </View>

              {/* Product Name */}
              <Text style={styles.productName}>{product.name}</Text>

              {/* Brand (conditional) */}
              {product.brand != null && (
                <Text style={styles.brand}>{product.brand}</Text>
              )}

              {/* Price */}
              <Text style={styles.price}>
                {formatPrice(product.price, product.currency)}
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Product link hint */}
              <Text style={styles.availableText}>
                Available on {product.platform}
              </Text>
            </View>
          </ScrollView>

          {/* Buy Now Button — Pinned to bottom */}
          <View style={styles.buyNowContainer}>
            <Pressable
              onPress={handleBuyNow}
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={GRADIENTS.cta as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buyNowButton}
              >
                <Text style={styles.buyNowText}>Buy Now</Text>
                <ExternalLink size={18} color={COLORS.white} />
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },

  // Close button
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  scrollView: {
    flex: 1,
  },

  // Hero image
  heroContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
  },

  // Content area
  content: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.xl,
  },

  // Badge (inline pill)
  badge: {
    borderRadius: RADIUS.badge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 10,
    textTransform: 'uppercase',
  },

  // Product info
  productName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  brand: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },
  price: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.coral,
    marginTop: SPACING.md,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.gray700,
    marginVertical: SPACING.xl,
    width: '100%',
  },

  // Available text
  availableText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.gray400,
  },

  // Buy Now
  buyNowContainer: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  buyNowButton: {
    height: COMPONENT.buttonHeight,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...SHADOWS.ctaButton,
  },
  buyNowText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    marginRight: SPACING.sm,
  },
});
