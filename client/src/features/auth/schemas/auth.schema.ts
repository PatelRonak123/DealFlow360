import { LoginCredentials, RegisterCredentials } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateLogin = (credentials: LoginCredentials): ValidationResult => {
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!email) {
    return { isValid: false, error: 'Email address is required.' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }

  return { isValid: true };
};

export const validateSignup = (credentials: RegisterCredentials): ValidationResult => {
  const name = credentials.name.trim();
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!name || name.length < 2) {
    return { isValid: false, error: 'Full name must be at least 2 characters long.' };
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Full name cannot exceed 100 characters.' };
  }

  if (!email) {
    return { isValid: false, error: 'Work email is required.' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid work email address.' };
  }

  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }

  return { isValid: true };
};
