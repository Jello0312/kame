// ═══════════════════════════════════════════════════════════════
// FavoritesScreen — 2-column grid of liked products
// ═══════════════════════════════════════════════════════════════
// Shows all products the user has swiped right on. Tapping a card
// opens ProductDetailModal with full details and "Buy Now" CTA.
// Pull-to-refresh supported. Empty state encourages swiping.
// ═══════════════════════════════════════════════════════════════

import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FavoriteCard } from '../../components/FavoriteCard';
import { KameLogo } from '../../components/KameLogo';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import { SkeletonFavoriteCard } from '../../components/SkeletonCard';
import { api } from '../../services/api';
import { COLORS, COMPONENT, FONTS, RADIUS, SPACING } from '../../src/theme/constants';
import type { FavoriteItem } from '../../types/profile';

// ── Component ─────────────────────────────────────────────────

export default function FavoritesScreen() {
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

  // ─── Loading State ────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <KameLogo />
          <Text style={styles.title}>Your Favorites</Text>
        </View>
        <View style={styles.skeletonGrid}>
          <SkeletonFavoriteCard />
          <SkeletonFavoriteCard />
          <SkeletonFavoriteCard />
          <SkeletonFavoriteCard />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error State ──────────────────────────────────────────────

  if (isError) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <KameLogo />
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

  // ─── Empty State ──────────────────────────────────────────────

  if (data && data.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <KameLogo />
          <Text style={styles.title}>Your Favorites</Text>
        </View>
        <View style={styles.centered}>
          <Heart size={48} color={COLORS.gray500} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtitle}>
            Start swiping to save outfits you love
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Favorites Grid ───────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <KameLogo />
        <Text style={styles.title}>Your Favorites</Text>
        {data && (
          <Text style={styles.subtitle}>
            {data.length} {data.length === 1 ? 'item' : 'items'}
          </Text>
        )}
      </View>

      {/* Grid */}
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FavoriteCard item={item} onPress={setSelectedProduct} />
        )}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        refreshing={isRefetching}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  header: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },
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
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 20,
    marginTop: SPACING.xl,
  },
  emptySubtitle: {
    color: COLORS.gray400,
    fontFamily: FONTS.regular,
    fontSize: 15,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: COMPONENT.screenPadding,
  },
  columnWrapper: {
    gap: SPACING.md,
  },
  listContent: {
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING['4xl'],
    gap: SPACING.md,
  },
});
