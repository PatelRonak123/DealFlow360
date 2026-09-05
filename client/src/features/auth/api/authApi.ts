import { apiClient } from '@/api/apiClient';
import {
  AuthApiResponse,
  AuthResult,
  AuthUserContext,
  LoginCredentials,
  RegisterCredentials,
} from '../types';

export const authApi = {

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const response = await apiClient.post<AuthApiResponse<AuthResult>>('/auth/login', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Login failed');
    }
    return response.data.data;
  },

  
  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    const response = await apiClient.post<AuthApiResponse<AuthResult>>('/auth/register', credentials);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Registration failed');
    }
    return response.data.data;
  },

 
  async getCurrentUser(): Promise<AuthUserContext> {
    const response = await apiClient.get<AuthApiResponse<AuthUserContext>>('/auth/me');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch current user');
    }
    return response.data.data;
  },

  
  async refresh(refreshToken: string): Promise<AuthResult> {
    const response = await apiClient.post<AuthApiResponse<AuthResult>>('/auth/refresh', {
      refreshToken,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Token refresh failed');
    }
    return response.data.data;
  },


  async logout(refreshToken?: string): Promise<void> {
    try {
      await apiClient.post<AuthApiResponse<null>>('/auth/logout', { refreshToken });
    } catch {
    }
  },
};
