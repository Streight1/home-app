import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { CalendarPreferenceRecord } from '../domain/location.types.js';
import type { CalendarPreferenceRepository } from '../domain/ports/calendar-preference.repository.js';

@Injectable()
export class PrismaCalendarPreferenceRepository implements CalendarPreferenceRepository {
  public constructor(private readonly prisma: PrismaService) {}
  public getOrCreate(
    householdId: string,
    userId: string,
  ): Promise<CalendarPreferenceRecord> {
    return this.prisma.calendarUserPreference.upsert({
      where: { householdId_userId: { householdId, userId } },
      create: { householdId, userId },
      update: {},
    });
  }
  public update(
    input: Parameters<CalendarPreferenceRepository['update']>[0],
  ): Promise<CalendarPreferenceRecord> {
    return this.prisma.calendarUserPreference.upsert({
      where: {
        householdId_userId: {
          householdId: input.householdId,
          userId: input.userId,
        },
      },
      create: {
        householdId: input.householdId,
        userId: input.userId,
        ...input.patch,
      },
      update: input.patch,
    });
  }
}
