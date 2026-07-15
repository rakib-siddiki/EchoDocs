'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { getCookie, setCookie, deleteCookie } from '@/lib/auth-utils';

export interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: (options?: { shouldRedirect?: boolean }) => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const startRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Refresh every 14 minutes (shortly before 15m access token expires)
    refreshTimerRef.current = setTimeout(
      async () => {
        try {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            // Session expired, stop refresh timer (logout has already cleared it)
            return;
          }
        } catch (error) {
          console.error('Background token refresh failed, scheduling retry in 1 minute:', error);
          
          // Stop retrying if session has actually expired (token cookie was cleared by logout)
          if (!getCookie('token')) {
            console.log('Session is no longer active, stopping refresh timer.');
            return;
          }

          // If session didn't expire (e.g. network issue), schedule a retry in 1 minute
          refreshTimerRef.current = setTimeout(
            async () => {
              try {
                const newToken = await refreshAccessToken();
                if (!newToken) return;
              } catch (retryError) {
                console.error('Background token refresh retry failed, resetting timer:', retryError);
                if (!getCookie('token')) return;
                // Keep trying by resetting the main refresh timer
                startRefreshTimer();
              }
            },
            60 * 1000,
          );
        }
      },
      14 * 60 * 1000,
    );
  };

  const stopRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      let isSessionExpired = false;
      try {
        const response = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Sends HttpOnly refresh_token cookie
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            isSessionExpired = true;
            console.warn('Session expired (401/403) on token refresh. Logging out.');
            const isProtectedRoute =
              typeof window !== 'undefined' &&
              (window.location.pathname.startsWith('/dashboard') ||
                window.location.pathname.startsWith('/chat'));
            logout({ shouldRedirect: isProtectedRoute });
            return null;
          }
          throw new Error(
            `Refresh endpoint returned error status: ${response.status}`,
          );
        }

        const data = await response.json();
        setCookie('token', data.token, 1);
        setToken(data.token);

        // Schedule the next refresh
        startRefreshTimer();
        console.log('Successfully refreshed access token in background.');
        return data.token;
      } catch (error) {
        // If the error was a 401/403, we already logged out and returned null in the try block.
        // For other errors (like network offline), we log it and throw.
        console.error('Session expired or error refreshing token:', error);
        if (isSessionExpired) {
          const isProtectedRoute =
            typeof window !== 'undefined' &&
            (window.location.pathname.startsWith('/dashboard') ||
              window.location.pathname.startsWith('/chat'));
          logout({ shouldRedirect: isProtectedRoute });
        }
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  };

  useEffect(() => {
    async function loadUser() {
      let storedToken = getCookie('token');

      if (!storedToken) {
        try {
          storedToken = await refreshAccessToken();
        } catch (error) {
          // If refreshing token fails, refreshAccessToken will trigger logout
          // We just stop loading here.
          setIsLoading(false);
          return;
        }
      }

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setToken(storedToken);
          // Start automatic background token refresh
          startRefreshTimer();
        } else if (response.status === 401 || response.status === 403) {
          // Token is explicitly rejected by the backend. Try to refresh it.
          try {
            const newToken = await refreshAccessToken();
            if (!newToken) {
              const isProtectedRoute =
                window.location.pathname.startsWith('/dashboard') ||
                window.location.pathname.startsWith('/chat');
              logout({ shouldRedirect: isProtectedRoute });
              setIsLoading(false);
              return;
            }
            const retryResponse = await fetch(`${baseUrl}/auth/me`, {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            if (retryResponse.ok) {
              const userData = await retryResponse.json();
              setUser(userData);
              setToken(newToken);
              startRefreshTimer();
            } else {
              const isProtectedRoute =
                window.location.pathname.startsWith('/dashboard') ||
                window.location.pathname.startsWith('/chat');
              logout({ shouldRedirect: isProtectedRoute });
            }
          } catch (refreshErr) {
            console.error(
              'Failed to auto-refresh token on initial load:',
              refreshErr,
            );
          }
        } else {
          console.warn(
            `Server error ${response.status} checking session. Retaining offline session.`,
          );
        }
      } catch (error) {
        // Fetch failed due to network error (e.g., server offline). Keep local session intact!
        console.error(
          'Network error checking user profile, retaining session:',
          error,
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      stopRefreshTimer();
    };
  }, []);

  // Proactively refresh tokens when the window/tab is focused or becomes visible
  useEffect(() => {
    const handleFocus = async () => {
      const storedToken = getCookie('token');
      if (!storedToken) {
        return;
      }

      try {
        const tokenParts = storedToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const exp = payload.exp * 1000;
          const now = Date.now();

          // If expired or expiring in less than 2 minutes, refresh it immediately
          if (exp - now < 2 * 60 * 1000) {
            console.log('Access token is close to expiry or expired, refreshing on window focus.');
            await refreshAccessToken();
          }
        }
      } catch (err) {
        console.error('Failed to check/refresh token on window focus:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Necessary to receive Set-Cookie for HttpOnly refresh_token
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setCookie('token', data.token, 1);
    setUser(data.user);
    setToken(data.token);

    // Start background refresh
    startRefreshTimer();

    router.push('/dashboard');
  };

  const register = async (email: string, password: string) => {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Necessary to receive Set-Cookie for HttpOnly refresh_token
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    setCookie('token', data.token, 1);
    setUser(data.user);
    setToken(data.token);

    // Start background refresh
    startRefreshTimer();

    router.push('/dashboard');
  };

  const logout = async (options?: { shouldRedirect?: boolean }) => {
    const shouldRedirect = options?.shouldRedirect ?? true;
    stopRefreshTimer();

    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Clean backend logout failed:', e);
    }

    deleteCookie('token');
    setUser(null);
    setToken(null);

    if (shouldRedirect) {
      router.push('/sign-in');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
