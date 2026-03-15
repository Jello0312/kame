const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

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

  async get<T>(path: string, tokenOverride?: string | null): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${path}`;
    const headers = this.buildHeaders(undefined, tokenOverride);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const json: ApiResponse<T> = await response.json();

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

  async post<T>(
    path: string,
    body?: unknown,
    tokenOverride?: string | null,
  ): Promise<ApiResponse<T>> {
    const url = `${BASE_URL}${path}`;
    const headers = this.buildHeaders(body, tokenOverride);

    const requestBody =
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBody,
    });

    const json: ApiResponse<T> = await response.json();

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
}

export const api = new ApiClient();
