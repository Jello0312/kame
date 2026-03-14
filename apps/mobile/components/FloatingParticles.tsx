// ═══════════════════════════════════════════════════════════════
// FloatingParticles — Animated background dots for auth screens
// ═══════════════════════════════════════════════════════════════
// ~20 small teal-tinted circles that drift slowly across the
// screen. Pure decoration — pointerEvents="none" on container.
// Uses react-native-reanimated withRepeat + withTiming pattern
// from SkeletonCard.tsx.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const PARTICLE_COUNT = 20;

// ── Seed-based pseudo-random (deterministic per index) ──────

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ── Single Particle ─────────────────────────────────────────

interface ParticleConfig {
  index: number;
  screenWidth: number;
  screenHeight: number;
}

function Particle({ index, screenWidth, screenHeight }: ParticleConfig) {
  const r = (offset: number) => seededRandom(index * 7 + offset);

  const size = 2 + r(0) * 3; // 2–5px
  const baseOpacity = 0.05 + r(1) * 0.15; // 0.05–0.20
  const startX = r(2) * screenWidth;
  const startY = r(3) * screenHeight;
  const driftX = (r(4) - 0.5) * screenWidth * 0.4; // ±20% screen width
  const driftY = (r(5) - 0.5) * screenHeight * 0.3; // ±15% screen height
  const duration = 8000 + r(6) * 7000; // 8–15 seconds
  const delay = r(7) * 3000; // stagger start by 0–3s

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(driftX, { duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(driftY, { duration: duration * 1.1, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [translateX, translateY, driftX, driftY, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `rgba(72, 230, 205, ${baseOpacity})`,
        },
        animatedStyle,
      ]}
    />
  );
}

// ── Container ───────────────────────────────────────────────

export function FloatingParticles() {
  const { width, height } = useWindowDimensions();

  const indices = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    [],
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {indices.map((i) => (
        <Particle key={i} index={i} screenWidth={width} screenHeight={height} />
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
