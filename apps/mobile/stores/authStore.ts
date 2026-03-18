import { create } from 'zustand';
import * as storage from '../src/storage';
import { api, ApiError } from '../services/api';
import { queryClient } from '../lib/queryClient';

const TOKEN_KEY = 'kame_auth_token';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionTier: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setHasCompletedOnboarding: (value: boolean) => void;
}

async function probeOnboardingStatus(token: string): Promise<boolean> {
  try {
    await api.get('/api/profile', token);
    return true;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return false;
    }
    // For other errors (network, 500, etc.), assume not onboarded
    return false;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,

  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });

    const { token, user } = res.data!;

    await storage.setItem(TOKEN_KEY, token);

    const onboarded = await probeOnboardingStatus(token);

    set({
      token,
      user,
      isAuthenticated: true,
      hasCompletedOnboarding: onboarded,
    });
  },

  register: async (email: string, password: string, name: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', {
      email,
      password,
      name,
    });

    const { token, user } = res.data!;

    await storage.setItem(TOKEN_KEY, token);

    set({
      token,
      user,
      isAuthenticated: true,
      hasCompletedOnboarding: false,
    });
  },

  logout: async () => {
    await storage.deleteItem(TOKEN_KEY);
    queryClient.clear();

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
    });
  },

  checkAuth: async () => {
    try {
      const token = await storage.getItem(TOKEN_KEY);

      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Validate token by fetching current user
      const res = await api.get<User>('/auth/me', token);
      const user = res.data!;

      const onboarded = await probeOnboardingStatus(token);

      set({
        token,
        user,
        isAuthenticated: true,
        hasCompletedOnboarding: onboarded,
        isLoading: false,
      });
    } catch {
      // Token is invalid or network error — clear everything
      await storage.deleteItem(TOKEN_KEY);

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCompletedOnboarding: false,
      });
    }
  },

  setHasCompletedOnboarding: (value: boolean) => {
    set({ hasCompletedOnboarding: value });
  },
}));
