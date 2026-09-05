export interface AuthUserContext {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUserContext;
  accessToken: string;
  refreshToken: string;
}

export interface AuthApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface AuthState {
  user: AuthUserContext | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
