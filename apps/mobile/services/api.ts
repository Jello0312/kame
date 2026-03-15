const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

if (!BASE_URL) {
  console.error(
    '[Kame API] EXPO_PUBLIC_API_URL is not set! ' +
    'Make sure apps/mobile/.env exists and restart Expo with --clear.',
  );
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  response: ApiResponse;

  constructor(message: string, status: number, response: ApiResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

async function parseJsonSafe<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    // Server returned non-JSON (e.g. Railway 502 HTML page)
    throw new ApiError(
      `Server error (${response.status}). Please try again.`,
      response.status,
      { success: false, error: `Non-JSON response from server` },
    );
  }
}

class ApiClient {
  private getToken(): string | null {
    // Lazy import to avoid circular dependency with authStore
    const { useAuthStore } = require('../stores/authStore');
    return useAuthStore.getState().token;
  }

  private async handleUnauthorized(): Promise<void> {
    const { useAuthStore } = require('../stores/authStore');
    await useAuthStore.getState().logout();
  }

  private buildHeaders(
    body?: unknown,
    tokenOverride?: string | null,
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    const token = tokenOverride ?? this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do NOT set Content-Type for FormData — fetch sets multipart boundary automatically
    if (body && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    tokenOverride?: string | null,
  ): Promise<ApiResponse<T>> {
    if (!BASE_URL) {
      throw new ApiError(
        'API not configured. Restart Expo with: npx expo start --clear',
        0,
        { success: false, error: 'EXPO_PUBLIC_API_URL is not set' },
      );
    }

    const url = `${BASE_URL}${path}`;
    const headers = this.buildHeaders(body, tokenOverride);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body:
          method === 'POST'
            ? body instanceof FormData
              ? body
              : body
                ? JSON.stringify(body)
                : undefined
            : undefined,
      });
    } catch (err) {
      // Network-level failure (DNS, timeout, no internet, etc.)
      throw new ApiError(
        'Cannot connect to server. Check your internet connection.',
        0,
        { success: false, error: 'Network request failed' },
      );
    }

    const json = await parseJsonSafe<T>(response);

    if (response.status === 401) {
      await this.handleUnauthorized();
      throw new ApiError(
        json.error ?? 'Unauthorized',
        response.status,
        json,
      );
    }

    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error ?? json.message ?? `Request failed with status ${response.status}`,
        response.status,
        json,
      );
    }

    return json;
  }

  async get<T>(path: string, tokenOverride?: string | null): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, tokenOverride);
  }

  async post<T>(
    path: string,
    body?: unknown,
    tokenOverride?: string | null,
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, tokenOverride);
  }
}

export const api = new ApiClient();
