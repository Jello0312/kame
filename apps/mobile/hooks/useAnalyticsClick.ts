import { useCallback } from 'react';
import { api } from '../services/api';

/**
 * Fire-and-forget hook for POST /api/analytics/click.
 * Used by ProductDetailModal's "Buy Now" button.
 * Failures are logged but never block the UX.
 */
export function useAnalyticsClick() {
  return useCallback(async (productId: string, platform: string) => {
    try {
      await api.post('/api/analytics/click', { productId, platform });
    } catch {
      console.warn('Analytics click failed');
    }
  }, []);
}
