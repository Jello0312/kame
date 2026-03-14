// ═══════════════════════════════════════════════════════════════
// AuthBackground — Light pastel flowing gradient for auth screens
// ═══════════════════════════════════════════════════════════════
// Creates a soft, animated gradient effect with drifting color blobs
// that transition between mint, peach, lavender, and light blue.
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

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
    color: 'rgba(72, 230, 205, 0.30)',    // Mint/teal — top-left area
    size: 320,
    startX: -0.1,
    startY: -0.05,
    driftX: 0.15,
    driftY: 0.12,
    duration: 18000,
  },
  {
    color: 'rgba(250, 150, 130, 0.22)',    // Peach/coral — bottom area
    size: 300,
    startX: 0.4,
    startY: 0.7,
    driftX: 0.18,
    driftY: 0.10,
    duration: 22000,
  },
  {
    color: 'rgba(140, 120, 200, 0.15)',    // Lavender — center-right
    size: 260,
    startX: 0.6,
    startY: 0.3,
    driftX: 0.12,
    driftY: 0.15,
    duration: 20000,
  },
  {
    color: 'rgba(100, 200, 240, 0.20)',    // Light blue — top-right
    size: 280,
    startX: 0.5,
    startY: -0.1,
    driftX: 0.14,
    driftY: 0.10,
    duration: 16000,
  },
  {
    color: 'rgba(250, 200, 160, 0.18)',    // Warm peach — bottom-left
    size: 240,
    startX: -0.05,
    startY: 0.55,
    driftX: 0.16,
    driftY: 0.12,
    duration: 24000,
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

export function AuthBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <>
      {/* Base gradient: soft mint → white → soft peach */}
      <LinearGradient
        colors={['#E8FAF6', '#F5FBFF', '#FFFFFF', '#FFF5EE', '#FFF0E8']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated color blobs */}
      {BLOBS.map((blob, index) => (
        <ColorBlob
          key={index}
          config={blob}
          screenWidth={width}
          screenHeight={height}
        />
      ))}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
  },
});
