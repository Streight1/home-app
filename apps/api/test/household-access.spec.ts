import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import type { AppConfigService } from '../src/config/app-config.service.js';

const config = { singleHouseholdMode: false } as AppConfigService;

describe('HouseholdAccessService', () => {
  it('allows an active member to access their own household', async () => {
    const prisma = {
      householdMember: {
        findFirst: vi.fn().mockResolvedValue({
          role: 'MEMBER',
          household: { id: 'household-a' },
        }),
      },
    };
    const service = new HouseholdAccessService(
      prisma as unknown as PrismaService,
      config,
    );
    await expect(
      service.assertMembership('user-a', 'household-a', 'MEMBER'),
    ).resolves.toMatchObject({
      household: { id: 'household-a' },
    });
    expect(prisma.householdMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-a',
          householdId: 'household-a',
          user: { status: 'ACTIVE' },
        },
      }),
    );
  });

  it('does not reveal or return household B to a user from household A', async () => {
    const prisma = {
      householdMember: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const service = new HouseholdAccessService(
      prisma as unknown as PrismaService,
      config,
    );
    await expect(
      service.assertMembership('user-a', 'household-b'),
    ).rejects.toMatchObject({
      code: 'HOUSEHOLD_NOT_FOUND',
    });
  });

  it('returns 403 when a VIEWER attempts a member mutation', async () => {
    const prisma = {
      householdMember: {
        findFirst: vi.fn().mockResolvedValue({
          role: 'VIEWER',
          household: { id: 'household-a' },
        }),
      },
    };
    const service = new HouseholdAccessService(
      prisma as unknown as PrismaService,
      config,
    );
    await expect(
      service.getActiveMembership('user-a', 'MEMBER'),
    ).rejects.toMatchObject({ code: 'HOUSEHOLD_ACCESS_DENIED' });
  });
});
