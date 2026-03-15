// ═══════════════════════════════════════════════════════════════
// FavoritesScreen — Shopping-cart-style list of liked products
// ═══════════════════════════════════════════════════════════════
// Light background with white product cards, teal total bar,
// and "Proceed to Checkout" button that opens all product links.
// Tap any card to view details + individual "Buy Now" link.
// ═══════════════════════════════════════════════════════════════

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingCart as ShoppingCartIcon } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackground } from '../../components/AuthBackground';
import { CheckoutModal } from '../../components/CheckoutModal';
import { FavoriteCard } from '../../components/FavoriteCard';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import { SkeletonFavoriteCard } from '../../components/SkeletonCard';
import { api } from '../../services/api';
import {
  COLORS,
  COMPONENT,
  FONTS,
  RADIUS,
  SHADOWS,
  SPACING,
} from '../../src/theme/constants';
import type { FavoriteItem } from '../../types/profile';

// ── Helpers ───────────────────────────────────────────────────

function formatPrice(price: number, currency: string): string {
  return currency === 'USD'
    ? '$' + price.toFixed(2)
    : currency + ' ' + price.toFixed(2);
}

// ── Component ─────────────────────────────────────────────────

export default function FavoritesScreen() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<FavoriteItem[]>({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await api.get<FavoriteItem[]>('/api/favorites');
      return res.data!;
    },
  });

  const [selectedProduct, setSelectedProduct] = useState<FavoriteItem | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // ─── Unfavorite Mutation ─────────────────────────────────────

  const unfavoriteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.post('/api/swipe', { productId, action: 'DISLIKE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleRemove = useCallback(
    (item: FavoriteItem) => {
      unfavoriteMutation.mutate(item.id);
    },
    [unfavoriteMutation],
  );

  // ─── Checkout: show modal with all product links ─────────────

  const handleCheckout = useCallback(() => {
    if (!data || data.length === 0) return;
    setShowCheckout(true);
  }, [data]);

  // ─── Computed values ─────────────────────────────────────────

  const total = data?.reduce((sum, item) => sum + item.price, 0) ?? 0;
  const totalCurrency = data?.[0]?.currency ?? 'USD';
  const itemCount = data?.length ?? 0;

  // ─── Loading State ──────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <AuthBackground />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ShoppingCartIcon size={24} color={COLORS.navy} />
            <Text style={styles.title}>Favorites</Text>
          </View>
        </View>
        <View style={styles.skeletonList}>
          <SkeletonFavoriteCard />
          <SkeletonFavoriteCard />
          <SkeletonFavoriteCard />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error State ────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <AuthBackground />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ShoppingCartIcon size={24} color={COLORS.navy} />
            <Text style={styles.title}>Favorites</Text>
          </View>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Something went wrong'}
          </Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Empty State ────────────────────────────────────────────

  if (data && data.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <AuthBackground />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ShoppingCartIcon size={24} color={COLORS.navy} />
            <Text style={styles.title}>Favorites</Text>
          </View>
        </View>
        <View style={styles.centered}>
          <Heart size={48} color={COLORS.gray400} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Start swiping to save outfits you love
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── List Footer: Total + Checkout ──────────────────────────

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      {/* Total Bar */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{formatPrice(total, totalCurrency)}</Text>
      </View>

      {/* Proceed to Checkout */}
      <Pressable
        onPress={handleCheckout}
        disabled={itemCount === 0}
        style={({ pressed }) => [
          styles.checkoutButton,
          pressed && { opacity: 0.85 },
          itemCount === 0 && { opacity: 0.5 },
        ]}
      >
        <Text style={styles.checkoutText}>Proceed to Checkout</Text>
      </Pressable>
    </View>
  );

  // ─── Favorites List ─────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AuthBackground />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShoppingCartIcon size={24} color={COLORS.navy} />
          <Text style={styles.title}>Favorites</Text>
        </View>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {/* Product List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FavoriteCard
            item={item}
            onPress={setSelectedProduct}
            onRemove={handleRemove}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={isRefetching}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderFooter}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Checkout Modal — all product links */}
      <CheckoutModal
        visible={showCheckout}
        items={data ?? []}
        onClose={() => setShowCheckout(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.navy,
  },
  itemCount: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
  },

  // List
  listContent: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['4xl'],
    gap: SPACING.md,
  },

  // Footer: Total + Checkout
  footerContainer: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
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
  checkoutButton: {
    backgroundColor: COLORS.tealBright,
    height: COMPONENT.buttonHeight,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.tealButton,
  },
  checkoutText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },

  // States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.medium,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.tealBright,
    paddingHorizontal: SPACING['3xl'],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.button,
  },
  retryButtonText: {
    color: COLORS.navy,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
  emptyTitle: {
    color: COLORS.navy,
    fontFamily: FONTS.bold,
    fontSize: 20,
    marginTop: SPACING.xl,
  },
  emptySubtitle: {
    color: COLORS.gray500,
    fontFamily: FONTS.regular,
    fontSize: 15,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  skeletonList: {
    paddingHorizontal: COMPONENT.screenPadding,
    gap: SPACING.md,
  },
});
