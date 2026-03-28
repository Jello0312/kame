// ═══════════════════════════════════════════════════════════════
// AppBackground — Decorative background for tab screens
// ═══════════════════════════════════════════════════════════════
// Subtle teal/coral blobs, a decorative circle outline, and a
// thin accent line — inspired by the kame-ai.com landing page.
// Uses the same animated blob pattern as AuthBackground.tsx.
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../src/theme/constants';

// ── Blob Configuration ───────────────────────────────────────

interface BlobConfig {
  color: string;
  size: number;
  startX: number; // fraction of screen width (0-1)
  startY: number; // fraction of screen height (0-1)
  driftX: number; // drift range as fraction of screen width
  driftY: number; // drift range as fraction of screen height
  duration: number; // ms for one drift cycle
}

const BLOBS: BlobConfig[] = [
  {
    color: 'rgba(72, 230, 205, 0.12)',    // Teal — top-left area
    size: 340,
    startX: -0.15,
    startY: -0.08,
    driftX: 0.12,
    driftY: 0.10,
    duration: 20000,
  },
  {
    color: 'rgba(72, 230, 205, 0.07)',    // Teal — center-right, softer
    size: 280,
    startX: 0.55,
    startY: 0.35,
    driftX: 0.10,
    driftY: 0.12,
    duration: 24000,
  },
  {
    color: 'rgba(250, 104, 105, 0.06)',   // Coral — bottom area, very subtle
    size: 300,
    startX: 0.3,
    startY: 0.65,
    driftX: 0.14,
    driftY: 0.08,
    duration: 22000,
  },
];

// ── Animated Blob Component ──────────────────────────────────

function ColorBlob({ config, screenWidth, screenHeight }: {
  config: BlobConfig;
  screenWidth: number;
  screenHeight: number;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const driftXPx = config.driftX * screenWidth;
    const driftYPx = config.driftY * screenHeight;

    translateX.value = withRepeat(
      withTiming(driftXPx, {
        duration: config.duration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    translateY.value = withRepeat(
      withTiming(driftYPx, {
        duration: config.duration * 1.15,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [config, screenWidth, screenHeight, translateX, translateY]);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        blobStyle,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
          left: config.startX * screenWidth - config.size / 2,
          top: config.startY * screenHeight - config.size / 2,
        },
      ]}
      pointerEvents="none"
    />
  );
}

// ── Main Component ───────────────────────────────────────────

export function AppBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.container]} pointerEvents="none">
      {/* Solid base — new warmWhite #FAF9F7 */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: COLORS.warmWhite }]} />

      {/* Animated color blobs */}
      {BLOBS.map((blob, index) => (
        <ColorBlob
          key={index}
          config={blob}
          screenWidth={width}
          screenHeight={height}
        />
      ))}

      {/* Decorative circle outline — inspired by landing page .phone-circle */}
      <View
        style={[
          styles.decoCircle,
          {
            top: height * 0.15,
            left: width * 0.45,
          },
        ]}
      />

      {/* Subtle horizontal accent line — inspired by landing page dividers */}
      <View
        style={[
          styles.decoLine,
          {
            top: height * 0.42,
            left: width * 0.08,
            width: width * 0.25,
          },
        ]}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
  decoCircle: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: 'rgba(72, 230, 205, 0.08)',
  },
  decoLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(200, 196, 192, 0.15)',
  },
});
