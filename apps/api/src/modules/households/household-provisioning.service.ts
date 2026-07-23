import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { ApiException } from '../../common/errors/api-exception.js';
import { AppConfigService } from '../../config/app-config.service.js';
import type { VerifiedGoogleIdentity } from '../auth/auth.types.js';
import { calendarMemberColorForIndex } from './household.types.js';

const SINGLE_HOUSEHOLD_BOOTSTRAP_ID = 'primary';

@Injectable()
export class HouseholdProvisioningService {
  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public async provision(
    transaction: Prisma.TransactionClient,
    identity: VerifiedGoogleIdentity,
  ) {
    if (!this.config.singleHouseholdMode)
      return this.provisionPersonalHousehold(transaction, identity);
    return this.provisionSingleHousehold(transaction, identity);
  }

  private async provisionSingleHousehold(
    transaction: Prisma.TransactionClient,
    identity: VerifiedGoogleIdentity,
  ) {
    const isOwner =
      identity.email.trim().toLowerCase() ===
      this.config.singleHouseholdOwnerEmail;
    let bootstrap = await transaction.singleHouseholdBootstrap.findUnique({
      where: { id: SINGLE_HOUSEHOLD_BOOTSTRAP_ID },
      include: { household: true },
    });
    if (!bootstrap && !isOwner) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'HOUSEHOLD_OWNER_NOT_INITIALIZED',
        'Sdílená domácnost zatím nebyla založena. Nejprve se musí přihlásit její vlastník.',
      );
    }

    const user = await this.upsertUser(transaction, identity);
    if (!bootstrap) {
      const householdId = await this.resolveOwnerHousehold(
        transaction,
        user.id,
      );
      bootstrap = await transaction.singleHouseholdBootstrap.create({
        data: { id: SINGLE_HOUSEHOLD_BOOTSTRAP_ID, householdId },
        include: { household: true },
      });
    }

    const memberCount = await transaction.householdMember.count({
      where: { householdId: bootstrap.householdId },
    });
    const membership = await transaction.householdMember.upsert({
      where: {
        householdId_userId: {
          householdId: bootstrap.householdId,
          userId: user.id,
        },
      },
      create: {
        householdId: bootstrap.householdId,
        userId: user.id,
        role: isOwner ? 'OWNER' : 'MEMBER',
        calendarColorToken: calendarMemberColorForIndex(memberCount),
      },
      update: { role: isOwner ? 'OWNER' : 'MEMBER' },
      include: { household: true },
    });
    return { user, membership };
  }

  private async resolveOwnerHousehold(
    transaction: Prisma.TransactionClient,
    userId: string,
  ): Promise<string> {
    const memberships = await transaction.householdMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    const owned = memberships.filter(
      (membership) => membership.role === 'OWNER',
    );
    if (owned.length > 1 || (memberships.length > 0 && owned.length !== 1)) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'HOUSEHOLD_SINGLE_MODE_AMBIGUOUS',
        'Sdílenou domácnost nelze bezpečně určit. Zkontrolujte existující členství vlastníka.',
      );
    }
    if (owned[0]) return owned[0].householdId;
    const household = await transaction.household.create({
      data: { name: this.config.singleHouseholdName },
    });
    return household.id;
  }

  private async provisionPersonalHousehold(
    transaction: Prisma.TransactionClient,
    identity: VerifiedGoogleIdentity,
  ) {
    const user = await this.upsertUser(transaction, identity, true);
    const membership = await transaction.householdMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { household: true },
    });
    if (!membership) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'AUTH_HOUSEHOLD_MISSING',
        'Domácnost se nepodařilo načíst.',
      );
    }
    return { user, membership };
  }

  private async upsertUser(
    transaction: Prisma.TransactionClient,
    identity: VerifiedGoogleIdentity,
    createPersonalHousehold = false,
  ) {
    const now = new Date();
    const existing = await transaction.user.findUnique({
      where: { googleSubject: identity.subject },
    });
    if (existing?.status === 'DISABLED') {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'AUTH_ACCOUNT_DISABLED',
        'Tento účet je deaktivovaný.',
      );
    }
    const profile = {
      email: identity.email,
      emailVerified: identity.emailVerified,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      lastLoginAt: now,
    };
    if (existing)
      return transaction.user.update({
        where: { id: existing.id },
        data: profile,
      });
    return transaction.user.create({
      data: {
        googleSubject: identity.subject,
        ...profile,
        ...(createPersonalHousehold
          ? {
              householdMembers: {
                create: {
                  role: 'OWNER' as const,
                  calendarColorToken: 'violet',
                  household: { create: { name: 'Moje domácnost' } },
                },
              },
            }
          : {}),
      },
    });
  }
}
