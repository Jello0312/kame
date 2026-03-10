import { create } from 'zustand';

interface OnboardingState {
  // Step 1
  gender: 'M' | 'W' | null;
  heightCm: number | null;
  weightKg: number | null;
  waistCm: number | null;
  bodyShape: string | null;
  measurementUnit: 'METRIC' | 'IMPERIAL';

  // Step 2
  facePhotoUri: string | null;
  bodyPhotoUri: string | null;

  // Step 3
  budgetRange: string | null;
  fashionStyles: string[];
  preferredPlatforms: string[];

  // Actions
  setMeasurements: (
    data: Partial<
      Pick<
        OnboardingState,
        | 'gender'
        | 'heightCm'
        | 'weightKg'
        | 'waistCm'
        | 'bodyShape'
        | 'measurementUnit'
      >
    >,
  ) => void;
  setPhotos: (
    data: Partial<Pick<OnboardingState, 'facePhotoUri' | 'bodyPhotoUri'>>,
  ) => void;
  setPreferences: (
    data: Partial<
      Pick<
        OnboardingState,
        'budgetRange' | 'fashionStyles' | 'preferredPlatforms'
      >
    >,
  ) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  gender: null,
  heightCm: null,
  weightKg: null,
  waistCm: null,
  bodyShape: null,
  measurementUnit: 'METRIC' as const,

  facePhotoUri: null,
  bodyPhotoUri: null,

  budgetRange: null,
  fashionStyles: [] as string[],
  preferredPlatforms: [] as string[],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...INITIAL_STATE,

  setMeasurements: (data) => set(data),
  setPhotos: (data) => set(data),
  setPreferences: (data) => set(data),
  reset: () => set(INITIAL_STATE),
}));
