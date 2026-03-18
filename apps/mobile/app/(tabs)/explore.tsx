import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';

import { AuthBackground } from '../../components/AuthBackground';
import { SwipeDeck } from '../../components/SwipeDeck';
import { KameLogo } from '../../components/KameLogo';
import { SkeletonSwipeCard } from '../../components/SkeletonCard';
import { api } from '../../services/api';
import { queryClient } from '../../lib/queryClient';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/theme/constants';
import type { FeedCard, FeedResponse } from '../../types/feed';

const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

// ─── Component ────────────────────────────────────────────────

export default function ExploreScreen() {
  const [isEmpty, setIsEmpty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const lastBatchTime = useRef<number>(0);

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

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    const elapsed = now - lastBatchTime.current;

    if (lastBatchTime.current > 0 && elapsed < COOLDOWN_MS) {
      Alert.alert(
        'Come Back Soon!',
        'Come Back in 15min For Your Next Fashion Show!',
        [{ text: 'OK' }],
      );
      return;
    }

    // Generate new batch of try-on images
    setIsGenerating(true);
    try {
      await api.post('/api/tryon/batch', {});
      lastBatchTime.current = Date.now();

      // Poll for completion (up to 60s)
      let attempts = 0;
      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 3000));
        const status = await api.get<{
          completed: number;
          pending: number;
          processing: number;
        }>('/api/tryon/status');
        const s = status.data!;
        if (s.completed >= 5 || (s.pending === 0 && s.processing === 0)) {
          break;
        }
        attempts++;
      }

      // Clear feed cache and refetch with new try-on images
      queryClient.removeQueries({ queryKey: ['feed'] });
      setIsEmpty(false);
      refetch();
    } catch (err) {
      // 429 = cooldown still active
      if (err instanceof Error && err.message.includes('wait')) {
        Alert.alert(
          'Come Back Soon!',
          'Come Back in 15min For Your Next Fashion Show!',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Error', 'Failed to generate new styles. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [refetch]);

  // ─── Loading State ────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <AuthBackground />
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
        <AuthBackground />
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
        <AuthBackground />
        <View style={styles.header}>
          <KameLogo />
        </View>
        <View style={styles.centered}>
          <Text style={styles.sessionText}>
            Come Back in 15min For{'\n'}Your Next Fashion Show!
          </Text>
          <Pressable
            style={[styles.retryButton, isGenerating && { opacity: 0.6 }]}
            onPress={handleRefresh}
            disabled={isGenerating}
          >
            <Text style={styles.retryButtonText}>
              {isGenerating ? 'Generating...' : 'Refresh'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Swipe Deck ───────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AuthBackground />
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
    backgroundColor: '#F0FAFB',
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
  sessionText: {
    color: COLORS.tealBright,
    fontFamily: FONTS.bold,
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 32,
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
