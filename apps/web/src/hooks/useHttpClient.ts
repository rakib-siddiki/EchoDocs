'use client';

import { getCookie } from '@/lib/auth-utils';
import { useAuth } from '@/contexts/AuthContext';

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export function useHttpClient() {
  const { refreshAccessToken } = useAuth();

  const getAuthHeaders = (
    tokenOverride?: string | null,
  ): Record<string, string> => {
    const activeToken =
      tokenOverride !== undefined ? tokenOverride : getCookie('token');
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  };

  const request = async <T>(
    path: string,
    options: RequestInit & { _isRaw?: boolean } = {},
  ): Promise<T> => {
    const headers = {
      ...options.headers,
      ...getAuthHeaders(),
    };

    let response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    // If access token is expired (401), try refreshing it on-demand (RTK Query / Interceptor style)
    if (
      response.status === 401 &&
      path !== '/auth/login' &&
      path !== '/auth/register' &&
      path !== '/auth/refresh'
    ) {
      try {
        // Use the centralized and deduplicated refresh logic from AuthContext
        const newToken = await refreshAccessToken();

        // Retry the original request with the new access token
        const retryHeaders = {
          ...headers,
          ...getAuthHeaders(newToken),
        };

        response = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers: retryHeaders,
        });
      } catch (err) {
        console.error('Failed to auto-refresh token during fetch:', err);
      }
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (_) {
        try {
          const textError = await response.text();
          errorMessage = textError || errorMessage;
        } catch (__) {}
      }
      throw new Error(errorMessage);
    }

    if (options._isRaw) {
      return response as unknown as T;
    }

    if (response.status === 204) {
      return null as unknown as T;
    }

    return response.json();
  };

  return {
    raw: (path: string, options?: RequestInit) =>
      request<Response>(path, { ...options, _isRaw: true }),
    get: <T>(path: string, options?: RequestInit) =>
      request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: RequestInit) => {
      const isFormData = body instanceof FormData;
      const headers = {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      };
      return request<T>(path, {
        ...options,
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });
    },
    put: <T>(path: string, body?: unknown, options?: RequestInit) => {
      const isFormData = body instanceof FormData;
      const headers = {
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers,
      };
      return request<T>(path, {
        ...options,
        method: 'PUT',
        headers,
        body: isFormData ? body : JSON.stringify(body),
      });
    },
    delete: <T>(path: string, options?: RequestInit) =>
      request<T>(path, { ...options, method: 'DELETE' }),
  };
}
