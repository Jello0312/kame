import { View, Text, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useOnboardingStore } from '../../stores/onboardingStore';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
  COMPONENT,
  SHADOWS,
} from '../../src/theme/constants';

export default function PhotosScreen() {
  const router = useRouter();
  const { facePhotoUri, bodyPhotoUri, setPhotos } = useOnboardingStore();

  async function requestPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photo library to select photos. Please enable it in your device settings.',
      );
      return false;
    }
    return true;
  }

  async function pickFacePhoto() {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos({ facePhotoUri: result.assets[0].uri });
    }
  }

  async function pickBodyPhoto() {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos({ bodyPhotoUri: result.assets[0].uri });
    }
  }

  function handleNext() {
    router.push('/onboarding/preferences');
  }

  function handleSkip() {
    router.push('/onboarding/preferences');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step Indicator */}
        <Text style={styles.stepIndicator}>Step 2 of 4</Text>

        {/* Heading */}
        <Text style={styles.heading}>Your Photos</Text>
        <Text style={styles.subheading}>
          We'll use these to show how outfits look on you
        </Text>

        {/* Photo Cards */}
        <View style={styles.cardRow}>
          {/* Face Photo Card */}
          <TouchableOpacity
            style={[styles.photoCard, { aspectRatio: 1 }]}
            onPress={pickFacePhoto}
            activeOpacity={0.7}
          >
            {facePhotoUri ? (
              <View style={styles.photoFill}>
                <Image
                  source={{ uri: facePhotoUri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.changeOverlay}>
                  <Text style={styles.changeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.placeholderIcon}>{'👤'}</Text>
                <Text style={styles.cardLabel}>Face Photo</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeTextOptional}>Optional</Text>
            </View>
          </TouchableOpacity>

          {/* Body Photo Card */}
          <TouchableOpacity
            style={[styles.photoCard, { aspectRatio: 3 / 4 }]}
            onPress={pickBodyPhoto}
            activeOpacity={0.7}
          >
            {bodyPhotoUri ? (
              <View style={styles.photoFill}>
                <Image
                  source={{ uri: bodyPhotoUri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.changeOverlay}>
                  <Text style={styles.changeText}>Change</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.placeholderIcon}>{'🧍'}</Text>
                <Text style={styles.cardLabel}>Full Body</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeTextRecommended}>Recommended</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Guidance */}
        <Text style={styles.guidance}>
          For best results, use a full-body photo with a plain background
        </Text>

        {/* Spacer */}
        <View style={styles.flex} />

        {/* Skip Link */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, SHADOWS.tealButton]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  container: {
    flex: 1,
    paddingHorizontal: COMPONENT.screenPadding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  stepIndicator: {
    ...TYPE.bodySm,
    color: COLORS.tealBright,
    marginBottom: SPACING.xl,
  },
  heading: {
    ...TYPE.headingXl,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPE.bodyMd,
    color: COLORS.gray400,
    marginBottom: SPACING['3xl'],
  },
  // Photo cards
  cardRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  photoCard: {
    flex: 1,
    borderRadius: RADIUS.cardSm,
    overflow: 'hidden',
    position: 'relative',
  },
  emptyCard: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
    opacity: 0.6,
  },
  cardLabel: {
    ...TYPE.bodySm,
    color: COLORS.gray400,
  },
  photoFill: {
    flex: 1,
    position: 'relative',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: SPACING.xs,
    alignItems: 'center',
  },
  changeText: {
    ...TYPE.bodySm,
    color: COLORS.white,
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
  },
  badgeTextOptional: {
    ...TYPE.bodySm,
    color: COLORS.gray400,
  },
  badgeTextRecommended: {
    ...TYPE.bodySm,
    color: COLORS.tealBright,
  },
  // Guidance
  guidance: {
    ...TYPE.bodySm,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  // Skip
  skipButton: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  skipText: {
    ...TYPE.bodyMd,
    fontFamily: FONTS.medium,
    color: COLORS.tealBright,
  },
  // Next Button
  nextButton: {
    height: COMPONENT.buttonHeight,
    backgroundColor: COLORS.tealBright,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },
});
