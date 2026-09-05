import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@/types/Auth';
import { authApi } from '../api/authApi';
import {
  getAccessToken,
  setAuthTokens,
  clearAuthTokens,
} from '@/api/apiClient';
import {
  normalizeRole,
  getRoleTitle,
  getPrimaryRole,
  ROLES,
} from '@/lib/accessControl';

export interface AuthContextUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  permissions: string[];
  activeRole: UserRole;
  customer?: {
    id: string;
    companyName: string;
  };
  title: string;
}

export interface AuthContextType {
  user: AuthContextUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  switchRole: (role: UserRole) => void;
  login: (credentials?: { email?: string; password?: string } | unknown) => Promise<{ user: AuthContextUser }>;
  logout: () => Promise<void>;
  register: (data?: { name?: string; email?: string; password?: string } | unknown) => Promise<{ user: AuthContextUser }>;
  isSalesRep: boolean;
  isManager: boolean;
  isFinance: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AUTH_USER_KEY = 'dealflow360_user_session_v4';
const ACTIVE_ROLE_KEY = 'dealflow360_active_role_v4';

function parseNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return 'Enterprise User';
  const prefix = email.split('@')[0];
  const words = prefix.split(/[._-]/).filter(Boolean);
  if (words.length === 0) return 'Enterprise User';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const INITIAL_UNAUTHENTICATED_USER: AuthContextUser = {
  id: '',
  name: '',
  email: '',
  role: ROLES.SALES_REP,
  roles: [ROLES.SALES_REP],
  permissions: [],
  activeRole: ROLES.SALES_REP,
  title: getRoleTitle(ROLES.SALES_REP),
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextUser>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_UNAUTHENTICATED_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(getAccessToken());
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Hydrate user session from /api/v1/auth/me on startup
  useEffect(() => {
    let isMounted = true;

    async function initializeAuthSession() {
      const token = getAccessToken();
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsInitializing(false);
        }
        return;
      }

      try {
        const currentUserContext = await authApi.getCurrentUser();
        if (isMounted && currentUserContext) {
          const normalizedRoles = (currentUserContext.roles || [ROLES.SALES_REP]).map(normalizeRole);
          const savedActiveRole = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole | null;
          const activeRole =
            savedActiveRole && normalizedRoles.includes(normalizeRole(savedActiveRole))
              ? normalizeRole(savedActiveRole)
              : getPrimaryRole(normalizedRoles);

          const hydratedUser: AuthContextUser = {
            id: currentUserContext.userId,
            name: currentUserContext.name || parseNameFromEmail(currentUserContext.email),
            email: currentUserContext.email,
            role: activeRole,
            roles: normalizedRoles,
            permissions: currentUserContext.permissions || [],
            activeRole,
            customer: currentUserContext.customerId
              ? {
                  id: currentUserContext.customerId,
                  companyName: currentUserContext.customerName || 'Customer Account',
                }
              : undefined,
            title: getRoleTitle(activeRole),
          };

          setUser(hydratedUser);
          setIsAuthenticated(true);
          try {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(hydratedUser));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn('Could not restore auth session from server:', err);
        clearAuthTokens();
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(INITIAL_UNAUTHENTICATED_USER);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initializeAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const switchRole = (newRole: UserRole) => {
    const normalized = normalizeRole(newRole);
    const updated: AuthContextUser = {
      ...user,
      role: normalized,
      activeRole: normalized,
      title: getRoleTitle(normalized),
    };
    setUser(updated);
    try {
      localStorage.setItem(ACTIVE_ROLE_KEY, normalized);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const login = async (credentials?: unknown): Promise<{ user: AuthContextUser }> => {
    setIsLoading(true);
    const creds = credentials as { email?: string; password?: string } | undefined;

    if (!creds?.email || !creds?.password) {
      setIsLoading(false);
      throw new Error('Email and password are required.');
    }

    const rawEmail = creds.email.trim();
    const normalizedEmail = rawEmail.toLowerCase();
    const password = creds.password;

    try {
      const serverResult = await authApi.login({
        email: normalizedEmail,
        password,
      });

      if (!serverResult?.user || !serverResult.accessToken) {
        throw new Error('Authentication response did not contain valid user credentials.');
      }

      setAuthTokens(serverResult.accessToken, serverResult.refreshToken);

      const rawRoles = serverResult.user.roles || [ROLES.SALES_REP];
      const normalizedRoles = rawRoles.map(normalizeRole);
      const primaryRole = getPrimaryRole(normalizedRoles);

      const loggedUser: AuthContextUser = {
        id: serverResult.user.userId,
        name: serverResult.user.name || parseNameFromEmail(rawEmail),
        email: serverResult.user.email || rawEmail,
        role: primaryRole,
        roles: normalizedRoles,
        permissions: serverResult.user.permissions || [],
        activeRole: primaryRole,
        customer: serverResult.user.customerId
          ? {
              id: serverResult.user.customerId,
              companyName: serverResult.user.customerName || 'Customer Account',
            }
          : undefined,
        title: getRoleTitle(primaryRole),
      };

      setUser(loggedUser);
      setIsAuthenticated(true);
      setIsLoading(false);

      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedUser));
        localStorage.setItem(ACTIVE_ROLE_KEY, loggedUser.activeRole);
      } catch {
        // ignore
      }

      return { user: loggedUser };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    clearAuthTokens();
    setUser(INITIAL_UNAUTHENTICATED_USER);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(ACTIVE_ROLE_KEY);
      await authApi.logout();
    } catch {
      // ignore
    }
  };

  const register = async (data?: unknown): Promise<{ user: AuthContextUser }> => {
    setIsLoading(true);
    const regData = data as { name?: string; email?: string; password?: string } | undefined;

    if (!regData?.email || !regData?.password) {
      setIsLoading(false);
      throw new Error('Email and password are required for registration.');
    }

    const rawEmail = regData.email.trim();
    const rawName = regData.name?.trim() || parseNameFromEmail(rawEmail);

    try {
      const serverResult = await authApi.register({
        name: rawName,
        email: rawEmail.toLowerCase(),
        password: regData.password,
      });

      if (!serverResult?.user || !serverResult.accessToken) {
        throw new Error('Registration response did not contain valid user credentials.');
      }

      setAuthTokens(serverResult.accessToken, serverResult.refreshToken);

      const rawRoles = serverResult.user.roles || [ROLES.CUSTOMER];
      const normalizedRoles = rawRoles.map(normalizeRole);
      const primaryRole = getPrimaryRole(normalizedRoles);

      const registeredUser: AuthContextUser = {
        id: serverResult.user.userId,
        name: serverResult.user.name,
        email: serverResult.user.email,
        role: primaryRole,
        roles: normalizedRoles,
        permissions: serverResult.user.permissions || [],
        activeRole: primaryRole,
        title: getRoleTitle(primaryRole),
      };

      setUser(registeredUser);
      setIsAuthenticated(true);
      setIsLoading(false);

      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(registeredUser));
        localStorage.setItem(ACTIVE_ROLE_KEY, registeredUser.activeRole);
      } catch {
        // ignore
      }

      return { user: registeredUser };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const currentRole = user?.activeRole || user?.role || ROLES.SALES_REP;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isInitializing,
        switchRole,
        login,
        logout,
        register,
        isSalesRep: currentRole === ROLES.SALES_REP,
        isManager: currentRole === ROLES.SALES_MANAGER,
        isFinance: currentRole === ROLES.FINANCE,
        isAdmin: currentRole === ROLES.ADMIN,
        isCustomer: currentRole === ROLES.CUSTOMER,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const useAuthContext = useAuth;
