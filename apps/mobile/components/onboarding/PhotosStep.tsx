import { View, Text, TouchableOpacity, Image, Alert, StyleSheet, ScrollView, ActionSheetIOS, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus } from 'lucide-react-native';
import { useOnboardingStore } from '../../stores/onboardingStore';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
} from '../../src/theme/constants';

// ── Types ────────────────────────────────────────────────────

type PhotoType = 'face' | 'body';

interface PhotoUploadCardProps {
  label: string;
  photoUri: string | null;
  aspectRatio: number;
  onTapUpload: () => void;
  onReplace: () => void;
  onRemove: () => void;
}

// ── Photo Upload Card ────────────────────────────────────────

function PhotoUploadCard({
  label,
  photoUri,
  aspectRatio,
  onTapUpload,
  onReplace,
  onRemove,
}: PhotoUploadCardProps) {
  if (photoUri) {
    // ── Filled State ──
    return (
      <View style={[styles.card, styles.cardFilled, { aspectRatio }]}>
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* Label */}
        <View style={styles.filledLabel}>
          <Text style={styles.filledLabelText}>{label}</Text>
        </View>

        {/* Bottom action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onReplace}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Replace</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Empty State ──
  return (
    <TouchableOpacity
      style={[styles.card, styles.cardEmpty, { aspectRatio }]}
      onPress={onTapUpload}
      activeOpacity={0.7}
    >
      {/* Label at top-left */}
      <View style={styles.emptyLabel}>
        <Text style={styles.emptyLabelText}>{label}</Text>
      </View>

      {/* Center content */}
      <View style={styles.emptyContent}>
        <View style={styles.iconCircle}>
          <ImagePlus size={24} color={COLORS.gray500} />
        </View>
        <Text style={styles.uploadText}>Tap to upload</Text>
        <Text style={styles.uploadSubtext}>or take a photo</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Component ───────────────────────────────────────────

export function PhotosStep() {
  const { facePhotoUri, bodyPhotoUri, setPhotos } = useOnboardingStore();

  // ── Permission helpers ──

  async function requestLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photo library. Please enable it in your device settings.',
      );
      return false;
    }
    return true;
  }

  async function requestCameraPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera access to take a photo. Please enable it in your device settings.',
      );
      return false;
    }
    return true;
  }

  // ── Pick from gallery ──

  async function pickFromLibrary(type: PhotoType) {
    const ok = await requestLibraryPermission();
    if (!ok) return;

    const aspect: [number, number] = type === 'face' ? [1, 1] : [3, 4];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'face') {
        setPhotos({ facePhotoUri: result.assets[0].uri });
      } else {
        setPhotos({ bodyPhotoUri: result.assets[0].uri });
      }
    }
  }

  // ── Take photo with camera ──

  async function takePhoto(type: PhotoType) {
    const ok = await requestCameraPermission();
    if (!ok) return;

    const aspect: [number, number] = type === 'face' ? [1, 1] : [3, 4];
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect,
      quality: 0.9,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'face') {
        setPhotos({ facePhotoUri: result.assets[0].uri });
      } else {
        setPhotos({ bodyPhotoUri: result.assets[0].uri });
      }
    }
  }

  // ── Remove photo ──

  function removePhoto(type: PhotoType) {
    if (type === 'face') {
      setPhotos({ facePhotoUri: null });
    } else {
      setPhotos({ bodyPhotoUri: null });
    }
  }

  // ── Show source picker (camera vs gallery) ──

  function showSourcePicker(type: PhotoType) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto(type);
          if (buttonIndex === 2) pickFromLibrary(type);
        },
      );
    } else {
      Alert.alert('Upload Photo', 'Choose a source', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => takePhoto(type) },
        { text: 'Choose from Library', onPress: () => pickFromLibrary(type) },
      ]);
    }
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
      {/* Heading */}
      <Text style={styles.heading}>Your Photos</Text>
      <Text style={styles.subheading}>
        Upload your photos so we can show how outfits look on you
      </Text>

      {/* Photo Cards */}
      <View style={styles.cardRow}>
        <PhotoUploadCard
          label="Face Photo"
          photoUri={facePhotoUri}
          aspectRatio={1}
          onTapUpload={() => showSourcePicker('face')}
          onReplace={() => showSourcePicker('face')}
          onRemove={() => removePhoto('face')}
        />

        <PhotoUploadCard
          label="Full Body"
          photoUri={bodyPhotoUri}
          aspectRatio={3 / 4}
          onTapUpload={() => showSourcePicker('body')}
          onReplace={() => showSourcePicker('body')}
          onRemove={() => removePhoto('body')}
        />
      </View>

      {/* Guidance */}
      <Text style={styles.guidance}>
        For best results, use a full-body photo with a plain background
      </Text>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.lg,
  },
  heading: {
    ...TYPE.headingXl,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  subheading: {
    ...TYPE.bodyMd,
    color: COLORS.gray400,
    marginBottom: SPACING['2xl'],
  },

  // ── Card Row ──
  cardRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },

  // ── Card Base ──
  card: {
    flex: 1,
    borderRadius: RADIUS.cardSm,
    overflow: 'hidden',
    position: 'relative',
  },

  // ── Empty Card ──
  cardEmpty: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray200,
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  uploadText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.gray700,
    marginBottom: SPACING.xs,
  },
  uploadSubtext: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.gray400,
  },
  emptyLabel: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    zIndex: 1,
  },
  emptyLabelText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.gray500,
  },

  // ── Filled Card ──
  cardFilled: {
    backgroundColor: COLORS.gray200,
  },
  filledLabel: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    zIndex: 2,
  },
  filledLabelText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.white,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.white,
  },
  actionDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginVertical: 4,
  },

  // ── Guidance ──
  guidance: {
    ...TYPE.bodySm,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});
