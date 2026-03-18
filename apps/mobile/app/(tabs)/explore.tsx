import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { X } from 'lucide-react-native';

import { AuthBackground } from '../../components/AuthBackground';
import { SwipeDeck } from '../../components/SwipeDeck';
import { KameLogo } from '../../components/KameLogo';
import { SkeletonSwipeCard } from '../../components/SkeletonCard';
import { api } from '../../services/api';
import { queryClient } from '../../lib/queryClient';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/theme/constants';
import type { FeedCard, FeedResponse } from '../../types/feed';

const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const COOLDOWN_MESSAGE = 'Come Back in 15mins For\nYour Next Fashion Show!';

// ─── Component ────────────────────────────────────────────────

export default function ExploreScreen() {
  const [isEmpty, setIsEmpty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCooldownCard, setShowCooldownCard] = useState(false);
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
      return response.data!;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  // Flatten all pages into a single card array
  const allCards = data?.pages.flatMap((p) => p.cards) ?? [];

  // ─── Callbacks ────────────────────────────────────────────────

  const handleSwipe = useCallback(
    (_card: FeedCard, _direction: 'left' | 'right') => {},
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

    // Client-side cooldown check
    if (lastBatchTime.current > 0 && elapsed < COOLDOWN_MS) {
      setShowCooldownCard(true);
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
    } catch {
      // Any error (429 cooldown or other) — show cooldown card
      setShowCooldownCard(true);
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

  // ─── Empty / Session Complete State ───────────────────────────

  if (isEmpty || allCards.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <AuthBackground />
        <View style={styles.header}>
          <KameLogo />
        </View>
        <View style={styles.centered}>
          <Text style={styles.sessionText}>{COOLDOWN_MESSAGE}</Text>
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

        {/* Cooldown overlay card */}
        {showCooldownCard && (
          <View style={styles.overlayContainer}>
            <View style={styles.cooldownCard}>
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowCooldownCard(false)}
                hitSlop={12}
              >
                <X size={20} color={COLORS.gray400} />
              </Pressable>
              <Text style={styles.cooldownText}>{COOLDOWN_MESSAGE}</Text>
            </View>
          </View>
        )}
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

  // Cooldown overlay card
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  cooldownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING['2xl'],
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cooldownText: {
    color: COLORS.tealBright,
    fontFamily: FONTS.bold,
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 30,
  },
});
