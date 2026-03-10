import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';

import { SwipeDeck } from '../../components/SwipeDeck';
import { KameLogo } from '../../components/KameLogo';
import { SkeletonSwipeCard } from '../../components/SkeletonCard';
import { api } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme/constants';
import type { FeedCard, FeedResponse } from '../../types/feed';

// ─── Component ────────────────────────────────────────────────

export default function ExploreScreen() {
  const [isEmpty, setIsEmpty] = useState(false);

  // Cursor-based infinite feed
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      const path = cursor
        ? `/api/feed?cursor=${encodeURIComponent(cursor)}&limit=10`
        : '/api/feed?limit=10';
      const response = await api.get<FeedResponse>(path);
      // api.get throws on non-success, so data is always present here
      return response.data!;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // Flatten all pages into a single card array
  const allCards = data?.pages.flatMap((p) => p.cards) ?? [];

  // ─── Callbacks ────────────────────────────────────────────────

  const handleSwipe = useCallback(
    (_card: FeedCard, _direction: 'left' | 'right') => {
      // Swipe API is fire-and-forget inside SwipeDeck.
      // Parent can add analytics tracking here if needed.
    },
    [],
  );

  const handleNeedMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleEmpty = useCallback(() => {
    setIsEmpty(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsEmpty(false);
    refetch();
  }, [refetch]);

  // ─── Loading State ────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <KameLogo />
        </View>
        <SkeletonSwipeCard />
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

  if (isEmpty || allCards.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.header}>
          <KameLogo />
        </View>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            Check back later for new styles
          </Text>
          <Pressable style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Swipe Deck ───────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <KameLogo />
      </View>
      <SwipeDeck
        cards={allCards}
        onSwipe={handleSwipe}
        onNeedMore={handleNeedMore}
        onEmpty={handleEmpty}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
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
  emptyTitle: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
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
});
