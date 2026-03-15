import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  cancelAnimation,
  Easing,
  runOnJS,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Heart, X } from 'lucide-react-native';

import { SwipeCard } from './SwipeCard';
import { api } from '../services/api';
import { COLORS, SWIPE, COMPONENT, SHADOWS, SPACING } from '../src/theme/constants';
import type { FeedCard } from '../types/feed';

// Tab bar height constant (matches CustomTabBar: 60px bar + 8px margin)
const TAB_BAR_HEIGHT = 68;

// ─── Props ───────────────────────────────────────────────────────────
interface SwipeDeckProps {
  cards: FeedCard[];
  onSwipe: (card: FeedCard, direction: 'left' | 'right') => void;
  onNeedMore: () => void;
  onEmpty: () => void;
}

/** Safe UUID v4 generator — uses crypto.randomUUID when available, Math.random fallback */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Fire-and-forget API call (module-level, no component deps) ──────
async function fireSwipeApi(
  card: FeedCard,
  direction: 'left' | 'right',
): Promise<void> {
  const action = direction === 'right' ? 'LIKE' : 'DISLIKE';

  try {
    if (card.isSolo && card.soloProduct) {
      await api.post('/api/swipe', {
        productId: card.soloProduct.id,
        action,
      });
    } else if (card.topProduct && card.bottomProduct) {
      const outfitGroupId = generateUUID();
      await Promise.all([
        api.post('/api/swipe', {
          productId: card.topProduct.id,
          action,
          outfitGroupId,
        }),
        api.post('/api/swipe', {
          productId: card.bottomProduct.id,
          action,
          outfitGroupId,
        }),
      ]);
    }
  } catch (error) {
    console.warn('Swipe API failed:', error);
  }
}

// ─── Component ───────────────────────────────────────────────────────
export function SwipeDeck({ cards, onSwipe, onNeedMore, onEmpty }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();

  // Shared animation values for the top card
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Spring config scoped to component so it references SWIPE constants
  const springConfig = {
    damping: SWIPE.springDamping,
    stiffness: SWIPE.springStiffness,
  };

  // Derive current visible cards
  const topCard = cards[currentIndex] as FeedCard | undefined;
  const secondCard = cards[currentIndex + 1] as FeedCard | undefined;
  const thirdCard = cards[currentIndex + 2] as FeedCard | undefined;

  // ─── Animated Styles ─────────────────────────────────────────────

  // Top card: translate + rotate with the gesture
  const topCardStyle = useAnimatedStyle(() => {
    const absX = Math.abs(translateX.value);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${translateX.value * SWIPE.rotationFactor}deg` },
      ],
      opacity: interpolate(
        absX,
        [0, SWIPE.exitX * 0.5, SWIPE.exitX],
        [1, 0.8, 0],
        'clamp',
      ),
    };
  });

  // Second card: scales from 0.95 -> 1 as the top card moves away
  const secondCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.abs(translateX.value) / SWIPE.threshold,
      1,
    );
    return {
      transform: [
        {
          scale: interpolate(
            progress,
            [0, 1],
            [SWIPE.stackScaleSecond, 1],
          ),
        },
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [SWIPE.stackOffsetSecond, 0],
          ),
        },
      ],
    };
  });

  // Third card: scales from 0.9 -> 0.95 as the top card moves away
  const thirdCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(
      Math.abs(translateX.value) / SWIPE.threshold,
      1,
    );
    return {
      transform: [
        {
          scale: interpolate(
            progress,
            [0, 1],
            [SWIPE.stackScaleThird, SWIPE.stackScaleSecond],
          ),
        },
        {
          translateY: interpolate(
            progress,
            [0, 1],
            [SWIPE.stackOffsetThird, SWIPE.stackOffsetSecond],
          ),
        },
      ],
    };
  });

  // ─── Swipe Completion Handler ────────────────────────────────────

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      const card = cards[currentIndex];
      if (!card) return;

      // Fire API (fire-and-forget, non-blocking)
      fireSwipeApi(card, direction);

      // 1. Cancel any in-flight exit animation
      cancelAnimation(translateX);
      cancelAnimation(translateY);

      // 2. Reset animation values BEFORE advancing index
      translateX.value = 0;
      translateY.value = 0;

      // 3. Defer state update to next tick so the reset is processed first
      const nextIndex = currentIndex + 1;
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        onSwipe(card, direction);

        if (cards.length - nextIndex < 3) {
          onNeedMore();
        }
        if (nextIndex >= cards.length) {
          onEmpty();
        }
      }, 0);
    },
    [currentIndex, cards, onSwipe, onNeedMore, onEmpty, translateX, translateY],
  );

  // ─── Pan Gesture (Gesture.Pan composable API) ────────────────────

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (translateX.value > SWIPE.threshold) {
        // Swipe RIGHT -> LIKE
        translateY.value = withSpring(event.translationY, springConfig);
        translateX.value = withSpring(SWIPE.exitX, springConfig, (finished) => {
          if (finished) {
            runOnJS(handleSwipeComplete)('right');
          }
        });
      } else if (translateX.value < -SWIPE.threshold) {
        // Swipe LEFT -> DISLIKE
        translateY.value = withSpring(event.translationY, springConfig);
        translateX.value = withSpring(-SWIPE.exitX, springConfig, (finished) => {
          if (finished) {
            runOnJS(handleSwipeComplete)('left');
          }
        });
      } else {
        // Snap back to center
        translateX.value = withSpring(0, springConfig);
        translateY.value = withSpring(0, springConfig);
      }
    });

  // ─── Programmatic Swipe (button taps) ────────────────────────────

  const handleLikePress = useCallback(() => {
    if (!topCard) return;
    translateX.value = withTiming(
      SWIPE.exitX,
      { duration: 300, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(handleSwipeComplete)('right');
        }
      },
    );
  }, [topCard, handleSwipeComplete, translateX]);

  const handleDislikePress = useCallback(() => {
    if (!topCard) return;
    translateX.value = withTiming(
      -SWIPE.exitX,
      { duration: 300, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(handleSwipeComplete)('left');
        }
      },
    );
  }, [topCard, handleSwipeComplete, translateX]);

  // Bottom padding: tab bar height + safe area
  const bottomPad = TAB_BAR_HEIGHT + insets.bottom;

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Card Stack Area */}
      <View style={styles.cardStack}>
        {/* Third card (bottom of visual stack, renders first) */}
        {thirdCard && (
          <Animated.View style={[styles.cardWrapper, thirdCardStyle]}>
            <SwipeCard card={thirdCard} isTop={false} />
          </Animated.View>
        )}

        {/* Second card (middle of stack) */}
        {secondCard && (
          <Animated.View style={[styles.cardWrapper, secondCardStyle]}>
            <SwipeCard card={secondCard} isTop={false} />
          </Animated.View>
        )}

        {/* Top card (interactive, gesture-enabled) */}
        {topCard && (
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.cardWrapper, topCardStyle]}>
              <SwipeCard
                card={topCard}
                isTop={true}
                translationX={translateX}
              />
            </Animated.View>
          </GestureDetector>
        )}
      </View>

      {/* Action Buttons Row */}
      <View style={[styles.buttonsRow, { paddingBottom: bottomPad }]}>
        <Pressable
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={handleDislikePress}
        >
          <X size={28} color={COLORS.white} strokeWidth={2.5} />
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLikePress}
        >
          <Heart
            size={28}
            color={COLORS.white}
            fill={COLORS.white}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardStack: {
    flex: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  cardWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingTop: SPACING.lg,
  },
  actionButton: {
    width: COMPONENT.swipeButtonSize,
    height: COMPONENT.swipeButtonSize,
    borderRadius: COMPONENT.swipeButtonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    backgroundColor: COLORS.green,
    ...SHADOWS.likeButton,
  },
  dislikeButton: {
    backgroundColor: COLORS.red,
    ...SHADOWS.dislikeButton,
  },
});
