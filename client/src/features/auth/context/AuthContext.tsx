import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  AuthResult,
  AuthUserContext,
  LoginCredentials,
  RegisterCredentials,
} from '../types';
import { authApi } from '../api/authApi';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  TOKEN_KEYS,
} from '@/api/apiClient';

export interface AuthContextValue {
  user: AuthUserContext | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (credentials: RegisterCredentials) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUserContext | null>(() => {
    try {
      const cached = localStorage.getItem(TOKEN_KEYS.USER_PROFILE);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize user profile with localStorage
  const updateUserProfile = useCallback((newUser: AuthUserContext | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem(TOKEN_KEYS.USER_PROFILE, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(TOKEN_KEYS.USER_PROFILE);
    }
  }, []);

  // Hydrate session on initial app load
  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      const token = getAccessToken();
      if (!token) {
        if (isMounted) {
          setIsLoading(false);
          updateUserProfile(null);
        }
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        if (isMounted) {
          updateUserProfile(currentUser);
          setAccessToken(token);
        }
      } catch (error) {
        console.warn('Session restoration failed, clearing stale auth:', error);
        if (isMounted) {
          clearAuthTokens();
          updateUserProfile(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [updateUserProfile]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResult> => {
    const result = await authApi.login(credentials);
    setAuthTokens(result.accessToken, result.refreshToken);
    updateUserProfile(result.user);
    setAccessToken(result.accessToken);
    return result;
  }, [updateUserProfile]);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<AuthResult> => {
    const result = await authApi.register(credentials);
    setAuthTokens(result.accessToken, result.refreshToken);
    updateUserProfile(result.user);
    setAccessToken(result.accessToken);
    return result;
  }, [updateUserProfile]);

  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = getRefreshToken() || undefined;
    try {
      await authApi.logout(refreshToken);
    } finally {
      clearAuthTokens();
      updateUserProfile(null);
      setAccessToken(null);
    }
  }, [updateUserProfile]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await authApi.getCurrentUser();
      updateUserProfile(currentUser);
    } catch {
      // Failed to refresh profile
    }
  }, [updateUserProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, accessToken, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
