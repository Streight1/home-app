import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiException } from '../../common/errors/api-exception.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import type { HouseholdRole } from './household.types.js';

const roleRank: Record<HouseholdRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

@Injectable()
export class HouseholdAccessService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public async assertMembership(
    userId: string,
    householdId: string,
    minimumRole: HouseholdRole = 'VIEWER',
  ) {
    const membership = await this.prisma.householdMember.findFirst({
      where: { userId, householdId, user: { status: 'ACTIVE' } },
      include: { household: true },
    });
    if (!membership) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'HOUSEHOLD_NOT_FOUND',
        'Domácnost nebyla nalezena.',
      );
    }
    if (roleRank[membership.role] < roleRank[minimumRole]) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'HOUSEHOLD_ACCESS_DENIED',
        'Pro tuto akci nemáte dostatečné oprávnění.',
      );
    }
    return membership;
  }

  public async getActiveMembership(
    userId: string,
    minimumRole: HouseholdRole = 'VIEWER',
  ) {
    const membership = await this.prisma.householdMember.findFirst({
      where: {
        userId,
        user: { status: 'ACTIVE' },
        ...(this.config.singleHouseholdMode
          ? { household: { singleHouseholdBootstrap: { isNot: null } } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: { household: true },
    });
    if (!membership) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'HOUSEHOLD_NOT_FOUND',
        'Domácnost nebyla nalezena.',
      );
    }
    if (roleRank[membership.role] < roleRank[minimumRole]) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'HOUSEHOLD_ACCESS_DENIED',
        'Pro tuto akci nemáte dostatečné oprávnění.',
      );
    }
    return membership;
  }

  public async assertActiveMembers(
    householdId: string,
    userIds: readonly string[],
  ): Promise<void> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return;
    const count = await this.prisma.householdMember.count({
      where: {
        householdId,
        userId: { in: unique },
        user: { status: 'ACTIVE' },
      },
    });
    if (count !== unique.length) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'HOUSEHOLD_MEMBER_INVALID',
        'Vybraný účastník není aktivním členem domácnosti.',
      );
    }
  }
}
