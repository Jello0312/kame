import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';

import { FloatingParticles } from '../FloatingParticles';
import { KameLogo } from '../KameLogo';
import { StepIndicator } from './StepIndicator';
import { MeasurementsStep } from './MeasurementsStep';
import { PhotosStep } from './PhotosStep';
import { PreferencesStep } from './PreferencesStep';
import { GeneratingStep } from './GeneratingStep';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
  COMPONENT,
  SHADOWS,
  GRADIENTS,
} from '../../src/theme/constants';

const TOTAL_STEPS = 4;
const ANIM_DURATION = 300;
const TIMING_CONFIG = { duration: ANIM_DURATION, easing: Easing.out(Easing.cubic) };

export function OnboardingWizard() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stepValid, setStepValid] = useState(false);

  // Animation shared values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // For rendering: we keep both outgoing and incoming steps during transition
  const [displayStep, setDisplayStep] = useState(0);

  const animateTransition = useCallback(
    (nextStep: number) => {
      if (isAnimating) return;
      setIsAnimating(true);

      const direction = nextStep > currentStep ? 1 : -1;

      // Slide current step out
      translateX.value = withTiming(-direction * screenWidth, TIMING_CONFIG);
      opacity.value = withTiming(0, TIMING_CONFIG, (finished) => {
        if (finished) {
          runOnJS(setDisplayStep)(nextStep);
          runOnJS(setCurrentStep)(nextStep);

          // Reset position to incoming side
          translateX.value = direction * screenWidth;
          opacity.value = 0;

          // Slide new step in
          translateX.value = withTiming(0, TIMING_CONFIG);
          opacity.value = withTiming(1, TIMING_CONFIG, (done) => {
            if (done) {
              runOnJS(setIsAnimating)(false);
            }
          });
        }
      });
    },
    [currentStep, isAnimating, screenWidth, translateX, opacity],
  );

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      animateTransition(currentStep + 1);
    }
  }, [currentStep, animateTransition]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      animateTransition(currentStep - 1);
    }
  }, [currentStep, animateTransition]);

  const handleValidChange = useCallback((isValid: boolean) => {
    setStepValid(isValid);
  }, []);


  const handleGenerateComplete = useCallback(() => {
    // Auth store already set hasCompletedOnboarding = true
    // Root layout will auto-redirect to (tabs)/explore
  }, []);

  // Animated style for step content
  const stepAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  // Determine button state
  const isStep1 = displayStep === 0;
  const isStep2 = displayStep === 1;
  const isStep3 = displayStep === 2;
  const isStep4 = displayStep === 3;
  const showBackButton = !isStep1 && !isStep4;
  const showNextButton = !isStep4;

  // Step 1 requires gender selection; steps 2 & 3 are always valid
  const isNextEnabled = isStep1 ? stepValid : true;

  function renderStepContent() {
    switch (displayStep) {
      case 0:
        return <MeasurementsStep onValidChange={handleValidChange} />;
      case 1:
        return <PhotosStep />;
      case 2:
        return <PreferencesStep />;
      case 3:
        return <GeneratingStep onComplete={handleGenerateComplete} />;
      default:
        return null;
    }
  }

  function renderBottomButton() {
    if (isStep4) return null;

    if (isStep3) {
      // Coral gradient "Generate My Styles" CTA
      return (
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.8}
          style={[styles.generateButtonWrapper, SHADOWS.ctaButton]}
        >
          <LinearGradient
            colors={GRADIENTS.cta as unknown as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateButton}
          >
            <Text style={styles.generateButtonText}>Generate My Styles</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // Teal "Next" button for steps 1 & 2
    return (
      <TouchableOpacity
        style={[
          styles.nextButton,
          !isNextEnabled && styles.nextButtonDisabled,
          isNextEnabled && SHADOWS.tealButton,
        ]}
        onPress={goNext}
        disabled={!isNextEnabled || isAnimating}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      {/* Background particles */}
      <FloatingParticles />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <KameLogo size={32} />
        </View>

        {/* Step Indicator (fixed — doesn't animate with steps) */}
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Card Container */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Animated step content */}
            <Animated.View style={[styles.stepContent, stepAnimStyle]}>
              {renderStepContent()}
            </Animated.View>
          </View>

          {/* Navigation Row — outside card but below it */}
          {!isStep4 && (
            <View style={styles.navRow}>
              {/* Back Button */}
              {showBackButton ? (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={goBack}
                  disabled={isAnimating}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={COLORS.tealBright} />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backPlaceholder} />
              )}

              {/* Next / Generate Button */}
              <View style={styles.nextButtonContainer}>
                {renderBottomButton()}
              </View>

              {/* Balance spacer */}
              {showBackButton ? (
                <View style={styles.backPlaceholder} />
              ) : (
                <View style={styles.backPlaceholder} />
              )}
            </View>
          )}

          {/* Step counter text */}
          {!isStep4 && (
            <Text style={styles.stepCounter}>
              Step {displayStep + 1} of {TOTAL_STEPS}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  safeArea: {
    flex: 1,
  },
  logoRow: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(3, 33, 59, 0.7)',
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(72, 230, 205, 0.15)',
    padding: SPACING.xl,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  stepContent: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  backButtonText: {
    ...TYPE.bodyMd,
    fontFamily: FONTS.medium,
    color: COLORS.tealBright,
  },
  backPlaceholder: {
    width: 70,
  },
  nextButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  nextButton: {
    height: COMPONENT.buttonHeight,
    backgroundColor: COLORS.tealBright,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['4xl'],
    minWidth: 160,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },
  generateButtonWrapper: {
    borderRadius: RADIUS.button,
    overflow: 'hidden',
    minWidth: 200,
  },
  generateButton: {
    height: COMPONENT.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  generateButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
  stepCounter: {
    ...TYPE.bodySm,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
