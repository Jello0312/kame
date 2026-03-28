import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { COLORS } from '../theme';

export function BrandIntro() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale-in animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Tagline fade-in (starts at 0.8s)
  const taglineOpacity = interpolate(frame, [fps * 0.8, fps * 1.3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Tagline slide-up
  const taglineY = interpolate(frame, [fps * 0.8, fps * 1.3], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Divider width animation (starts at 1.5s)
  const dividerWidth = interpolate(frame, [fps * 1.5, fps * 2], [0, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtitle fade-in (starts at 2s)
  const subtitleOpacity = interpolate(frame, [fps * 2, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.warmWhite,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Decorative teal circle */}
      <div
        style={{
          position: 'absolute',
          top: 300,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: `3px solid ${COLORS.tealBright}30`,
        }}
      />

      {/* Decorative coral blob */}
      <div
        style={{
          position: 'absolute',
          bottom: 200,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `${COLORS.coral}10`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'sans-serif',
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: 120,
            color: COLORS.tealBright,
            letterSpacing: -2,
          }}
        >
          Kame
        </span>
        <span
          style={{
            fontFamily: 'sans-serif',
            fontWeight: 600,
            fontSize: 28,
            color: COLORS.tealBright,
            opacity: 0.5,
            letterSpacing: 8,
            textTransform: 'uppercase',
            marginTop: -10,
          }}
        >
          Fashion AI
        </span>
      </div>

      {/* Kame Signature Divider */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          marginTop: 40,
        }}
      >
        <div
          style={{
            width: dividerWidth,
            height: 3,
            backgroundColor: COLORS.tealBright,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            width: dividerWidth * 0.6,
            height: 2,
            backgroundColor: COLORS.coral,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginTop: 50,
        }}
      >
        <span
          style={{
            fontFamily: 'sans-serif',
            fontWeight: 700,
            fontSize: 48,
            color: COLORS.body,
            textAlign: 'center',
          }}
        >
          See It. Swipe It. Own It.
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          marginTop: 24,
        }}
      >
        <span
          style={{
            fontFamily: 'sans-serif',
            fontWeight: 500,
            fontSize: 28,
            color: COLORS.bodyLight,
            textAlign: 'center',
          }}
        >
          AI-powered virtual try-on for fashion
        </span>
      </div>
    </AbsoluteFill>
  );
}
