import { db } from '../../../database/db.js';
import { refreshTokens, RefreshToken, NewRefreshToken } from '../../../database/schema/index.js';
import { eq, and, isNull, gt } from 'drizzle-orm';

export class RefreshTokensRepository {
  async create(data: NewRefreshToken): Promise<RefreshToken> {
    const [token] = await db.insert(refreshTokens).values(data).returning();
    return token;
  }

  async findActiveByTokenHash(tokenHash: string): Promise<RefreshToken | undefined> {
    const now = new Date();
    return db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, now)
      ),
    });
  }

  async revoke(id: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  }
}

export const refreshTokensRepository = new RefreshTokensRepository();
