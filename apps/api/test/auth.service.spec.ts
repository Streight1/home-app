import { HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import type { AppConfigService } from '../src/config/app-config.service.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type { VerifiedGoogleIdentity } from '../src/modules/auth/auth.types.js';
import type { GoogleTokenVerifierPort } from '../src/modules/auth/google/google-token-verifier.port.js';
import { SessionService } from '../src/modules/auth/session/session.service.js';
import { HouseholdProvisioningService } from '../src/modules/households/household-provisioning.service.js';
import type { HouseholdsService } from '../src/modules/households/households.service.js';

const identity: VerifiedGoogleIdentity = {
  subject: 'google-subject-1',
  email: 'jana@example.com',
  emailVerified: true,
  displayName: 'Jana Nováková',
  avatarUrl: 'https://example.com/avatar.jpg',
};

const user = {
  id: '10000000-0000-4000-8000-000000000001',
  googleSubject: identity.subject,
  email: identity.email,
  emailVerified: true,
  displayName: identity.displayName,
  avatarUrl: identity.avatarUrl,
  status: 'ACTIVE',
  lastLoginAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const household = {
  id: '20000000-0000-4000-8000-000000000002',
  name: 'Moje domácnost',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const membership = {
  id: '30000000-0000-4000-8000-000000000003',
  userId: user.id,
  householdId: household.id,
  role: 'OWNER',
  createdAt: new Date(),
  household,
};

function createHarness(
  allowedEmails: readonly string[] = ['jana@example.com'],
) {
  let storedUser: typeof user | null = null;
  const transaction = {
    user: {
      findUnique: vi.fn().mockImplementation(() => Promise.resolve(storedUser)),
      create: vi.fn().mockImplementation(() => {
        storedUser = user;
        return Promise.resolve(user);
      }),
      update: vi.fn().mockImplementation(() => Promise.resolve(user)),
    },
    householdMember: { findFirst: vi.fn().mockResolvedValue(membership) },
    session: {
      create: vi
        .fn()
        .mockResolvedValue({ id: '40000000-0000-4000-8000-000000000004' }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  };
  type Transaction = typeof transaction;
  type Callback = (value: Transaction) => Promise<unknown>;
  const prisma = {
    $transaction: vi
      .fn()
      .mockImplementation((callback: Callback) => callback(transaction)),
    user: transaction.user,
  };
  const config = {
    googleAllowedEmails: allowedEmails,
    sessionTtlDays: 30,
  };
  const verifier: GoogleTokenVerifierPort = {
    verify: vi.fn().mockResolvedValue(identity),
  };
  const typedPrisma = prisma as unknown as PrismaService;
  const typedConfig = config as unknown as AppConfigService;
  const households = {
    findFirstMembership: vi.fn().mockResolvedValue(membership),
  } as unknown as HouseholdsService;
  const service = new AuthService(
    typedPrisma,
    typedConfig,
    new AuditService(),
    new HouseholdProvisioningService(typedConfig),
    households,
    new SessionService(typedPrisma, typedConfig),
    verifier,
  );
  return { service, transaction, verifier };
}

describe('AuthService', () => {
  beforeEach(() => vi.useRealTimers());

  it('rejects an invalid Google token reported by the verifier', async () => {
    const harness = createHarness();
    vi.mocked(harness.verifier.verify).mockRejectedValue(
      new ApiException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_INVALID_GOOGLE_TOKEN',
        'Neplatný token.',
      ),
    );
    await expect(
      harness.service.loginWithGoogle('invalid', undefined),
    ).rejects.toMatchObject({
      code: 'AUTH_INVALID_GOOGLE_TOKEN',
    });
  });

  it('rejects an email outside the allowlist', async () => {
    const harness = createHarness(['someone-else@example.com']);
    await expect(
      harness.service.loginWithGoogle('credential', undefined),
    ).rejects.toMatchObject({
      code: 'AUTH_EMAIL_NOT_ALLOWED',
    });
    expect(harness.transaction.user.create).not.toHaveBeenCalled();
  });

  it('creates a user, default household and OWNER membership on first login', async () => {
    const harness = createHarness();
    const result = await harness.service.loginWithGoogle(
      'credential',
      'test-agent',
    );
    expect(harness.transaction.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          googleSubject: identity.subject,
          householdMembers: {
            create: expect.objectContaining({
              role: 'OWNER',
              household: { create: { name: 'Moje domácnost' } },
            }),
          },
        }),
      }),
    );
    expect(result.activeHousehold).toMatchObject({
      name: 'Moje domácnost',
      role: 'OWNER',
    });
  });

  it('does not create duplicate users or households on repeated login', async () => {
    const harness = createHarness();
    await harness.service.loginWithGoogle('credential', undefined);
    await harness.service.loginWithGoogle('credential', undefined);
    expect(harness.transaction.user.create).toHaveBeenCalledTimes(1);
    expect(harness.transaction.user.update).toHaveBeenCalledTimes(1);
  });

  it('stores only a SHA-256 session hash, never the raw token', async () => {
    const harness = createHarness();
    const result = await harness.service.loginWithGoogle(
      'credential',
      undefined,
    );
    const createArgument = harness.transaction.session.create.mock
      .calls[0]?.[0] as {
      data: { tokenHash: string };
    };
    expect(createArgument.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createArgument.data.tokenHash).not.toBe(result.sessionToken);
  });

  it('revokes the session and writes an audit event on logout', async () => {
    const harness = createHarness();
    await harness.service.logout('session-id', user.id);
    expect(harness.transaction.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'session-id', revokedAt: null }),
      }),
    );
    expect(harness.transaction.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'AUTH_LOGOUT_SUCCEEDED' }),
      }),
    );
  });
});
