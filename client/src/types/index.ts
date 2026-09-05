export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
  timestamp: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export type Nullable<T> = T | null;
