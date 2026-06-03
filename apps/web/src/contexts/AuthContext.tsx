'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_ROLES, type TAuthRole } from '@/constants';
import { getCookie, setCookie, deleteCookie } from '@/lib/auth-utils';

export interface User {
  id: string;
  email: string;
  role: TAuthRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    role?: TAuthRole,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  const startRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Refresh every 14 minutes (shortly before 15m access token expires)
    refreshTimerRef.current = setTimeout(async () => {
      try {
        await refreshAccessToken();
      } catch (error) {
        console.error('Background token refresh failed:', error);
      }
    }, 14 * 60 * 1000);
  };

  const stopRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Sends HttpOnly refresh_token cookie
      });

      if (!response.ok) {
        throw new Error('Refresh endpoint returned error status');
      }

      const data = await response.json();
      setCookie('token', data.token, 1);
      setToken(data.token);
      
      // Schedule the next refresh
      startRefreshTimer();
      console.log('Successfully refreshed access token in background.');
    } catch (error) {
      console.error('Session expired, logging out:', error);
      logout();
    }
  };

  useEffect(() => {
    async function loadUser() {
      const storedToken = getCookie('token');
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
          // Token is explicitly rejected by the backend
          logout();
        } else {
          console.warn(`Server error ${response.status} checking session. Retaining offline session.`);
        }
      } catch (error) {
        // Fetch failed due to network error (e.g., server offline). Keep local session intact!
        console.error('Network error checking user profile, retaining session:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    return () => {
      stopRefreshTimer();
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

  const register = async (email: string, password: string, role: TAuthRole = AUTH_ROLES.VIEWER) => {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Necessary to receive Set-Cookie for HttpOnly refresh_token
      body: JSON.stringify({ email, password, role }),
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

  const logout = async () => {
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
    router.push('/sign-in');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
