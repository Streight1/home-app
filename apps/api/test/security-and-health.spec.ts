import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CsrfGuard } from '../src/common/http/csrf.guard.js';
import { OriginGuard } from '../src/common/http/origin.guard.js';
import type { AppConfigService } from '../src/config/app-config.service.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { SessionService } from '../src/modules/auth/session/session.service.js';
import { HealthController } from '../src/modules/health/health.controller.js';
import { InternalHealthGuard } from '../src/modules/health/internal-health.guard.js';

function contextFor(request: object): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function sessionServiceFor(session: object | null) {
  const prisma = {
    session: {
      findUnique: vi.fn().mockResolvedValue(session),
      update: vi.fn().mockResolvedValue(session),
    },
  };
  const config = { sessionCookieName: 'life_admin_session' };
  return {
    service: new SessionService(
      prisma as unknown as PrismaService,
      config as AppConfigService,
    ),
    prisma,
  };
}

const activeSession = {
  id: 'session-id',
  userId: 'user-id',
  revokedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  user: { status: 'ACTIVE' },
};

describe('SessionService', () => {
  it('rejects auth/me without a session cookie', async () => {
    const { service } = sessionServiceFor(null);
    await expect(
      service.authenticateRequest({ cookies: {} } as never),
    ).rejects.toMatchObject({
      code: 'AUTH_INVALID_SESSION',
    });
  });

  it('rejects an expired session', async () => {
    const { service } = sessionServiceFor({
      ...activeSession,
      expiresAt: new Date(Date.now() - 1),
    });
    await expect(
      service.authenticateRequest({
        cookies: { life_admin_session: 'raw-token' },
      } as never),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it('rejects a revoked session', async () => {
    const { service } = sessionServiceFor({
      ...activeSession,
      revokedAt: new Date(),
    });
    await expect(
      service.authenticateRequest({
        cookies: { life_admin_session: 'raw-token' },
      } as never),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it('rejects a disabled user', async () => {
    const { service } = sessionServiceFor({
      ...activeSession,
      user: { status: 'DISABLED' },
    });
    await expect(
      service.authenticateRequest({
        cookies: { life_admin_session: 'raw-token' },
      } as never),
    ).rejects.toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });
});

describe('HTTP security guards', () => {
  const config = { webOrigin: 'http://localhost:5173' } as AppConfigService;
  const originGuard = new OriginGuard(config);
  const csrfGuard = new CsrfGuard({
    csrfCookieName: 'life_admin_csrf',
  } as AppConfigService);

  it('rejects an untrusted login Origin', () => {
    const context = contextFor({
      method: 'POST',
      path: '/api/v1/auth/google',
      headers: { origin: 'https://evil.test' },
    });
    expect(() => originGuard.canActivate(context)).toThrow(
      expect.objectContaining({ code: 'SECURITY_INVALID_ORIGIN' }),
    );
  });

  it('rejects logout without a matching CSRF cookie and header', () => {
    const context = contextFor({
      method: 'POST',
      path: '/api/v1/auth/logout',
      headers: { origin: 'http://localhost:5173' },
      cookies: {},
      header: () => undefined,
    });
    expect(() => csrfGuard.canActivate(context)).toThrow(
      expect.objectContaining({ code: 'SECURITY_INVALID_CSRF' }),
    );
  });
});

describe('InternalHealthGuard', () => {
  const token = '12345678901234567890123456789012';
  const guard = new InternalHealthGuard({
    internalHealthToken: token,
  } as AppConfigService);

  it.each([undefined, 'wrong-token'])(
    'rejects a missing or invalid internal token',
    (supplied) => {
      const context = contextFor({ header: () => supplied });
      expect(() => guard.canActivate(context)).toThrow(
        expect.objectContaining({ code: 'INTERNAL_UNAUTHORIZED' }),
      );
    },
  );

  it('accepts the configured internal token', () => {
    const context = contextFor({ header: () => token });
    expect(guard.canActivate(context)).toBe(true);
  });
});

describe('HealthController', () => {
  it('reports readiness when PostgreSQL responds', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const controller = new HealthController(prisma as unknown as PrismaService);
    await expect(controller.ready()).resolves.toEqual({
      status: 'ready',
      database: 'up',
    });
  });

  it('reports unavailable when PostgreSQL fails', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')),
    };
    const controller = new HealthController(prisma as unknown as PrismaService);
    await expect(controller.ready()).rejects.toMatchObject({
      code: 'DATABASE_UNAVAILABLE',
    });
  });
});
