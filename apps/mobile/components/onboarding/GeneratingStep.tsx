import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { KameLogo } from '../KameLogo';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import {
  COLORS,
  FONTS,
  TYPE,
  SPACING,
  RADIUS,
  COMPONENT,
  SHADOWS,
} from '../../src/theme/constants';

/** Convert a blob/data URI to a File object (web only) */
async function uriToFile(uri: string, fileName: string): Promise<File> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
}

interface GeneratingStepProps {
  onComplete: () => void;
}

export function GeneratingStep({ onComplete }: GeneratingStepProps) {
  const [status, setStatus] = useState('Setting up your profile...');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    submitOnboarding();
  }, []);

  async function submitOnboarding() {
    const store = useOnboardingStore.getState();

    try {
      // Phase 1: POST /api/profile
      setStatus('Setting up your profile...');
      await api.post('/api/profile', {
        gender: store.gender,
        ...(store.heightCm != null && { heightCm: store.heightCm }),
        ...(store.weightKg != null && { weightKg: store.weightKg }),
        ...(store.waistCm != null && { waistCm: store.waistCm }),
        ...(store.bodyShape != null && { bodyShape: store.bodyShape }),
        measurementUnit: store.measurementUnit,
      });

      // Phase 2: POST /api/avatar (FormData)
      if (store.facePhotoUri || store.bodyPhotoUri) {
        setStatus('Uploading your photos...');
        const formData = new FormData();

        if (store.bodyPhotoUri) {
          if (Platform.OS === 'web') {
            const file = await uriToFile(store.bodyPhotoUri, 'body.jpg');
            formData.append('bodyPhoto', file);
          } else {
            formData.append('bodyPhoto', {
              uri: store.bodyPhotoUri,
              type: 'image/jpeg',
              name: 'body.jpg',
            } as unknown as Blob);
          }
        }
        if (store.facePhotoUri) {
          if (Platform.OS === 'web') {
            const file = await uriToFile(store.facePhotoUri, 'face.jpg');
            formData.append('facePhoto', file);
          } else {
            formData.append('facePhoto', {
              uri: store.facePhotoUri,
              type: 'image/jpeg',
              name: 'face.jpg',
            } as unknown as Blob);
          }
        }
        await api.post('/api/avatar', formData);
      }

      // Phase 3: POST /api/preferences
      setStatus('Saving your preferences...');
      await api.post('/api/preferences', {
        budgetRange: store.budgetRange,
        fashionStyles: store.fashionStyles,
        preferredPlatforms: store.preferredPlatforms,
      });

      // Phase 4: Trigger try-on batch (may 503 if Redis not configured)
      setStatus('Generating your personalized outfits...');
      let tryOnTriggered = false;
      try {
        await api.post('/api/tryon/batch');
        tryOnTriggered = true;
      } catch (err) {
        console.warn('Try-on batch failed (Redis/FASHN may not be configured):', err);
      }

      // Phase 5: Poll status (only if batch was triggered)
      if (tryOnTriggered) {
        const MAX_POLLS = 20; // 20 * 3s = 60s max
        for (let i = 0; i < MAX_POLLS; i++) {
          try {
            const res = await api.get<{
              total: number;
              completed: number;
              pending: number;
              processing: number;
            }>('/api/tryon/status');
            const data = res.data!;
            setProgress(`Generating outfit ${data.completed} of ${data.total}...`);
            // Navigate early if 5+ ready or all done
            if (data.completed >= 5 || (data.pending === 0 && data.processing === 0)) break;
          } catch (err) {
            break;
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      // Done!
      useOnboardingStore.getState().reset();
      useAuthStore.getState().setHasCompletedOnboarding(true);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  function handleRetry() {
    setError('');
    submitOnboarding();
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <KameLogo size={40} />

      <View style={{ height: SPACING['3xl'] }} />

      {/* Loading / Error */}
      {error ? (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={handleRetry}
            activeOpacity={0.8}
            style={[styles.retryButton, SHADOWS.tealButton]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={COLORS.tealBright} />

          <View style={{ height: SPACING['2xl'] }} />

          {/* Status Text */}
          <Text style={styles.statusText}>{status}</Text>

          {/* Progress Text */}
          {progress ? (
            <Text style={styles.progressText}>{progress}</Text>
          ) : null}

          {/* Subtitle */}
          <Text style={styles.subtitle}>This usually takes about a minute</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    ...TYPE.bodyMd,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  retryButton: {
    height: COMPONENT.buttonHeight,
    paddingHorizontal: SPACING['3xl'],
    backgroundColor: COLORS.ctaNavigation,
    borderRadius: RADIUS.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.navy,
  },
  statusText: {
    ...TYPE.headingMd,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  progressText: {
    ...TYPE.bodyMd,
    color: COLORS.tealBright,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    ...TYPE.bodySm,
    color: COLORS.gray400,
    textAlign: 'center',
  },
});
