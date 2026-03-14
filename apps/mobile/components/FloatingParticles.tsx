// ═══════════════════════════════════════════════════════════════
// FloatingParticles — Animated background for auth screens
// ═══════════════════════════════════════════════════════════════
// ~35 teal-tinted circles + 3 large glow orbs that drift across
// the screen. Pure decoration — pointerEvents="none" on container.
// Uses react-native-reanimated withRepeat + withTiming pattern.
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

const PARTICLE_COUNT = 35;
const GLOW_ORB_COUNT = 3;

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

  const size = 3 + r(0) * 7;                    // 3–10px
  const baseOpacity = 0.10 + r(1) * 0.25;       // 0.10–0.35
  const startX = r(2) * screenWidth;
  const startY = r(3) * screenHeight;
  const driftX = (r(4) - 0.5) * screenWidth * 0.6;   // ±30% screen width
  const driftY = (r(5) - 0.5) * screenHeight * 0.5;  // ±25% screen height
  const duration = 6000 + r(6) * 6000;                // 6–12 seconds
  const delay = r(7) * 2000;                          // stagger 0–2s

  // 70% teal, 30% lighter teal for depth
  const isLighter = r(8) > 0.7;
  const color = isLighter
    ? `rgba(120, 240, 220, ${baseOpacity})`
    : `rgba(72, 230, 205, ${baseOpacity})`;

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
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// ── Glow Orb (large soft circle for atmospheric depth) ──────

interface GlowOrbConfig {
  index: number;
  screenWidth: number;
  screenHeight: number;
}

function GlowOrb({ index, screenWidth, screenHeight }: GlowOrbConfig) {
  const r = (offset: number) => seededRandom((index + 100) * 11 + offset);

  const size = 60 + r(0) * 80;                  // 60–140px
  const baseOpacity = 0.03 + r(1) * 0.04;       // 0.03–0.07
  const startX = r(2) * (screenWidth - size);
  const startY = r(3) * (screenHeight - size);
  const driftX = (r(4) - 0.5) * screenWidth * 0.4;
  const driftY = (r(5) - 0.5) * screenHeight * 0.4;
  const duration = 12000 + r(6) * 8000;         // 12–20s (slow drift)
  const delay = r(7) * 4000;

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
        withTiming(driftY, { duration: duration * 0.9, easing: Easing.inOut(Easing.ease) }),
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

  const particleIndices = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    [],
  );

  const orbIndices = useMemo(
    () => Array.from({ length: GLOW_ORB_COUNT }, (_, i) => i),
    [],
  );

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Large glow orbs (behind particles) */}
      {orbIndices.map((i) => (
        <GlowOrb key={`orb-${i}`} index={i} screenWidth={width} screenHeight={height} />
      ))}
      {/* Smaller particles (in front) */}
      {particleIndices.map((i) => (
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
