import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client.js';
import { ApiException } from '../../common/errors/api-exception.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import type { AuthProfile } from '../auth/auth.types.js';

@Injectable()
export class HouseholdsService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public async getAuthProfile(userId: string): Promise<AuthProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        householdMembers: {
          orderBy: { createdAt: 'asc' },
          include: {
            household: { include: { singleHouseholdBootstrap: true } },
          },
        },
      },
    });
    const membership = this.config.singleHouseholdMode
      ? user?.householdMembers.find(
          (item) => item.household.singleHouseholdBootstrap !== null,
        )
      : user?.householdMembers[0];
    if (!user || !membership || user.status === 'DISABLED') {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_INVALID_SESSION',
        'Přihlášení již není platné.',
      );
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      activeHousehold: {
        id: membership.household.id,
        name: membership.household.name,
        role: membership.role,
      },
    };
  }

  public findFirstMembership(
    transaction: Prisma.TransactionClient,
    userId: string,
  ) {
    return transaction.householdMember.findFirst({
      where: {
        userId,
        ...(this.config.singleHouseholdMode
          ? { household: { singleHouseholdBootstrap: { isNot: null } } }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
