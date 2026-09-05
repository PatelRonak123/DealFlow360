import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '@/types/Auth';
import { authApi } from '../api/authApi';

export interface AuthContextUser {
  id: string;
  name: string;
  role: UserRole;
  roles: string[];
  email: string;
  title: string;
}

export interface AuthContextType {
  user: AuthContextUser;
  isAuthenticated: boolean;
  isLoading: boolean;
  switchRole: (role: UserRole) => void;
  login: (credentials?: { email?: string; password?: string } | unknown) => Promise<{ user: AuthContextUser }>;
  logout: () => Promise<void>;
  register: (data?: { name?: string; email?: string; password?: string } | unknown) => Promise<{ user: AuthContextUser }>;
  isSalesRep: boolean;
  isManager: boolean;
  isFinance: boolean;
  isAdmin: boolean;
}

export function normalizeRole(roleStr?: string): UserRole {
  if (!roleStr) return 'sales_rep';
  const clean = roleStr.toLowerCase().replace(/-/g, '_');
  if (clean.includes('admin')) return 'admin';
  if (clean.includes('finance') || clean.includes('operations')) return 'finance_ops';
  if (clean.includes('manager') || clean.includes('director')) return 'sales_manager';
  if (clean.includes('customer') || clean.includes('client')) return 'customer';
  return 'sales_rep';
}

function getRoleTitle(role: UserRole): string {
  switch (role) {
    case 'sales_rep':
      return 'Senior Enterprise Sales Representative';
    case 'sales_manager':
      return 'Regional Sales Director';
    case 'finance_ops':
      return 'VP of Commercial Finance & Revenue Ops';
    case 'admin':
      return 'System & Governance Administrator';
    case 'customer':
      return 'Customer Procurement Lead';
    default:
      return 'Enterprise User';
  }
}

function parseNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return 'Sales Representative';
  const prefix = email.split('@')[0];
  const words = prefix.split(/[._-]/).filter(Boolean);
  if (words.length === 0) return 'Sales Representative';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

const AUTH_USER_KEY = 'dealflow360_logged_in_user_v2';

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
    // Default fallback profile if not logged in yet
    return {
      id: 'USR-REP-01',
      name: 'Riya Patel',
      role: 'sales_rep',
      roles: ['sales_rep'],
      email: 'riya.patel@dealflow360.io',
      title: 'Senior Enterprise Sales Representative',
    };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      return saved !== null;
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const switchRole = (newRole: UserRole) => {
    const updated: AuthContextUser = {
      ...user,
      role: newRole,
      roles: [newRole],
      title: getRoleTitle(newRole),
    };
    setUser(updated);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const login = async (credentials?: unknown): Promise<{ user: AuthContextUser }> => {
    setIsLoading(true);
    const creds = credentials as { email?: string; password?: string } | undefined;
    let loggedUser: AuthContextUser | null = null;

    if (creds?.email) {
      const rawEmail = creds.email.trim();
      const normalizedEmail = rawEmail.toLowerCase();
      const password = creds.password || '';

      // 1. Attempt real backend server login
      try {
        const serverResult = await authApi.login({
          email: normalizedEmail,
          password,
        });

        if (serverResult?.user) {
          const rawRole = serverResult.user.roles?.[0] || 'sales_rep';
          const detectedRole = normalizeRole(rawRole);
          loggedUser = {
            id: serverResult.user.userId,
            name: serverResult.user.name || parseNameFromEmail(rawEmail),
            email: serverResult.user.email || rawEmail,
            role: detectedRole,
            roles: [detectedRole],
            title: getRoleTitle(detectedRole),
          };
        }
      } catch (serverErr) {
        // Backend returned error or was unavailable; fallback to localized intelligent auth
        console.warn('Backend authentication offline/rejected, logging in locally:', serverErr);
      }

      // 2. Localized role resolution if backend is offline or mock login
      if (!loggedUser) {
        let detectedRole: UserRole = 'sales_rep';

        if (normalizedEmail.includes('manager') || normalizedEmail.includes('director') || normalizedEmail.includes('vikram')) {
          detectedRole = 'sales_manager';
        } else if (normalizedEmail.includes('finance') || normalizedEmail.includes('ops') || normalizedEmail.includes('ananya')) {
          detectedRole = 'finance_ops';
        } else if (normalizedEmail.includes('admin') || normalizedEmail.includes('rajesh')) {
          detectedRole = 'admin';
        } else if (normalizedEmail.includes('customer') || normalizedEmail.includes('client') || normalizedEmail.includes('sandeep')) {
          detectedRole = 'customer';
        }

        const name = parseNameFromEmail(rawEmail);

        loggedUser = {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name,
          email: rawEmail,
          role: detectedRole,
          roles: [detectedRole],
          title: getRoleTitle(detectedRole),
        };
      }
    } else {
      loggedUser = user;
    }

    setUser(loggedUser);
    setIsAuthenticated(true);
    setIsLoading(false);

    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedUser));
    } catch {
      // ignore
    }

    return { user: loggedUser };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      await authApi.logout();
    } catch {
      // ignore
    }
  };

  const register = async (data?: unknown): Promise<{ user: AuthContextUser }> => {
    setIsLoading(true);
    const regData = data as { name?: string; email?: string; password?: string } | undefined;
    let registeredUser: AuthContextUser | null = null;

    if (regData?.email) {
      const rawEmail = regData.email.trim();
      const rawName = regData.name?.trim() || parseNameFromEmail(rawEmail);

      try {
        const serverResult = await authApi.register({
          name: rawName,
          email: rawEmail.toLowerCase(),
          password: regData.password || '',
        });

        if (serverResult?.user) {
          const rawRole = serverResult.user.roles?.[0] || 'sales_rep';
          const detectedRole = normalizeRole(rawRole);
          registeredUser = {
            id: serverResult.user.userId,
            name: serverResult.user.name,
            email: serverResult.user.email,
            role: detectedRole,
            roles: [detectedRole],
            title: getRoleTitle(detectedRole),
          };
        }
      } catch (err) {
        console.warn('Backend registration failed, creating local user session:', err);
      }

      if (!registeredUser) {
        const detectedRole: UserRole = 'sales_rep';
        registeredUser = {
          id: `USR-${Date.now().toString().slice(-4)}`,
          name: rawName,
          email: rawEmail,
          role: detectedRole,
          roles: [detectedRole],
          title: getRoleTitle(detectedRole),
        };
      }
    } else {
      registeredUser = user;
    }

    setUser(registeredUser);
    setIsAuthenticated(true);
    setIsLoading(false);

    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(registeredUser));
    } catch {
      // ignore
    }

    return { user: registeredUser };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        switchRole,
        login,
        logout,
        register,
        isSalesRep: user.role === 'sales_rep',
        isManager: user.role === 'sales_manager',
        isFinance: user.role === 'finance_ops',
        isAdmin: user.role === 'admin',
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
