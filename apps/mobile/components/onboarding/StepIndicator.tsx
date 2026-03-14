import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING } from '../../src/theme/constants';

const STEP_LABELS = ['About You', 'Photos', 'Style', 'Generate'];
const DOT_SIZE = 28;
const DOT_ACTIVE_SIZE = 32;
const LINE_HEIGHT_PX = 2;
const TIMING_CONFIG = { duration: 300, easing: Easing.out(Easing.cubic) };

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

function StepDot({
  index,
  currentStep,
}: {
  index: number;
  currentStep: number;
}) {
  const isCompleted = index < currentStep;
  const isActive = index === currentStep;

  const dotStyle = useAnimatedStyle(() => {
    const size = isActive
      ? withTiming(DOT_ACTIVE_SIZE, TIMING_CONFIG)
      : withTiming(DOT_SIZE, TIMING_CONFIG);
    return {
      width: size,
      height: size,
      borderRadius: size,
    };
  });

  return (
    <View style={styles.dotContainer}>
      <Animated.View
        style={[
          styles.dot,
          dotStyle,
          isCompleted && styles.dotCompleted,
          isActive && styles.dotActive,
          !isCompleted && !isActive && styles.dotInactive,
        ]}
      >
        {isActive && <View style={styles.dotInner} />}
      </Animated.View>
      <Text
        style={[
          styles.label,
          (isActive || isCompleted) && styles.labelActive,
        ]}
      >
        {STEP_LABELS[index]}
      </Text>
    </View>
  );
}

function ConnectorLine({
  index,
  currentStep,
}: {
  index: number;
  currentStep: number;
}) {
  const filled = index < currentStep;

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(filled ? '100%' : '0%', TIMING_CONFIG) as unknown as number,
  }));

  return (
    <View style={styles.lineContainer}>
      <View style={styles.lineTrack} />
      <Animated.View style={[styles.lineFill, fillStyle]} />
    </View>
  );
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progressWidth = (currentStep / (totalSteps - 1)) * 100;

  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progressWidth}%`, TIMING_CONFIG) as unknown as number,
  }));

  return (
    <View style={styles.container}>
      {/* Dots Row */}
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View key={i} style={styles.stepItem}>
            {i > 0 && <ConnectorLine index={i} currentStep={currentStep} />}
            <StepDot index={i} currentStep={currentStep} />
          </View>
        ))}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  dotContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: COLORS.tealBright,
  },
  dotActive: {
    backgroundColor: COLORS.tealBright,
  },
  dotInactive: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.navy,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  labelActive: {
    color: COLORS.navy,
  },
  lineContainer: {
    flex: 1,
    height: LINE_HEIGHT_PX,
    marginHorizontal: -4,
    marginBottom: 20,
    position: 'relative',
  },
  lineTrack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 1,
  },
  lineFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: COLORS.tealBright,
    borderRadius: 1,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 2,
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.tealBright,
    borderRadius: 2,
  },
});
