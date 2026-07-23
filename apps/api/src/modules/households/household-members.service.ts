import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiException } from '../../common/errors/api-exception.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from './household-access.service.js';
import type { CalendarMemberColorToken } from './household.types.js';

@Injectable()
export class HouseholdMembersService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  public async listForUser(userId: string) {
    const membership = await this.access.getActiveMembership(userId);
    return this.listActiveMembers(membership.householdId);
  }

  public async listActiveMembers(householdId: string) {
    const memberships = await this.prisma.householdMember.findMany({
      where: { householdId, user: { status: 'ACTIVE' } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map(({ role, user, calendarColorToken }) => ({
      ...user,
      role,
      calendarColorToken,
    }));
  }

  public async updateCalendarColor(
    userId: string,
    targetUserId: string,
    calendarColorToken: CalendarMemberColorToken,
  ) {
    const membership = await this.access.getActiveMembership(userId);
    if (
      targetUserId !== userId &&
      membership.role !== 'OWNER' &&
      membership.role !== 'ADMIN'
    )
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'HOUSEHOLD_ACCESS_DENIED',
        'Barvu jiného člena může změnit pouze správce domácnosti.',
      );
    const updated = await this.prisma.householdMember.updateMany({
      where: { householdId: membership.householdId, userId: targetUserId },
      data: { calendarColorToken },
    });
    if (!updated.count)
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'HOUSEHOLD_NOT_FOUND',
        'Člen domácnosti nebyl nalezen.',
      );
    return this.listForUser(userId);
  }

  public async assertActiveMembers(
    householdId: string,
    userIds: readonly string[],
  ): Promise<void> {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return;
    const count = await this.prisma.householdMember.count({
      where: {
        householdId,
        userId: { in: uniqueIds },
        user: { status: 'ACTIVE' },
      },
    });
    if (count !== uniqueIds.length) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'HOUSEHOLD_MEMBER_INVALID',
        'Vybraný člen nepatří do této domácnosti.',
      );
    }
  }
}
