import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../config/env.js';
import { UnauthorizedError } from '../../../common/errors/index.js';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function generateRefreshTokenString(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Access token expired', { code: 'TOKEN_EXPIRED' });
    }
    throw new UnauthorizedError('Invalid access token', { code: 'TOKEN_INVALID' });
  }
}
