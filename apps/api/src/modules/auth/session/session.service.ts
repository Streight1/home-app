import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Prisma } from '../../../generated/prisma/client.js';
import { ApiException } from '../../../common/errors/api-exception.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class SessionService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public async authenticateRequest(request: Request): Promise<void> {
    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    const rawToken = cookies?.[this.config.sessionCookieName];
    if (!rawToken) this.reject();
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashSessionToken(rawToken) },
      include: { user: true },
    });
    const now = new Date();
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= now ||
      session.user.status === 'DISABLED'
    )
      this.reject();
    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: now },
    });
    (request as AuthenticatedRequest).auth = {
      sessionId: session.id,
      userId: session.userId,
    };
  }

  public async create(
    transaction: Prisma.TransactionClient,
    userId: string,
    userAgent: string | undefined,
  ) {
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.config.sessionTtlDays * 86_400_000,
    );
    const session = await transaction.session.create({
      data: {
        userId,
        tokenHash: hashSessionToken(rawToken),
        expiresAt,
        lastUsedAt: new Date(),
        userAgent: userAgent?.slice(0, 512) ?? null,
      },
    });
    return { sessionId: session.id, rawToken, expiresAt };
  }

  public async revoke(
    transaction: Prisma.TransactionClient,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const result = await transaction.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count === 0) this.reject();
  }

  private reject(): never {
    throw new ApiException(
      HttpStatus.UNAUTHORIZED,
      'AUTH_INVALID_SESSION',
      'Přihlášení již není platné.',
    );
  }
}
