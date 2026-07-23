import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { CalendarEventTravelPlanRecord } from '../domain/travel/travel-plan.types.js';
import type { CalendarEventTravelPlanRepository } from '../domain/travel/calendar-event-travel-plan.repository.js';

const mapPlan = (
  plan: CalendarEventTravelPlanRecord,
): CalendarEventTravelPlanRecord => plan;

@Injectable()
export class PrismaCalendarEventTravelPlanRepository implements CalendarEventTravelPlanRepository {
  public constructor(private readonly prisma: PrismaService) {}
  public find(householdId: string, eventId: string, travelerUserId: string) {
    return this.prisma.calendarEventTravelPlan
      .findFirst({ where: { householdId, eventId, travelerUserId } })
      .then((value) => (value ? mapPlan(value) : null));
  }
  public listForEvent(householdId: string, eventId: string) {
    return this.prisma.calendarEventTravelPlan
      .findMany({
        where: { householdId, eventId },
        orderBy: { createdAt: 'asc' },
      })
      .then((items) => items.map(mapPlan));
  }
  public listForEvents(
    householdId: string,
    eventIds: readonly string[],
    travelerUserId: string,
  ) {
    return this.prisma.calendarEventTravelPlan
      .findMany({
        where: { householdId, eventId: { in: [...eventIds] }, travelerUserId },
      })
      .then((items) => items.map(mapPlan));
  }
  public async upsertConfiguration(
    input: Parameters<
      CalendarEventTravelPlanRepository['upsertConfiguration']
    >[0],
  ) {
    const { userId: _userId, ...data } = input;
    void _userId;
    return mapPlan(
      await this.prisma.calendarEventTravelPlan.upsert({
        where: {
          eventId_travelerUserId: {
            eventId: input.eventId,
            travelerUserId: input.travelerUserId,
          },
        },
        create: { ...data, status: 'STALE' },
        update: { ...data, status: 'STALE' },
      }),
    );
  }
  public async markEventPlansStale(householdId: string, eventId: string) {
    await this.prisma.calendarEventTravelPlan.updateMany({
      where: { householdId, eventId },
      data: { status: 'STALE' },
    });
  }
  public async markDependentPlansStale(
    householdId: string,
    previousEventId: string,
  ) {
    await this.prisma.calendarEventTravelPlan.updateMany({
      where: { householdId, previousEventId },
      data: { status: 'STALE' },
    });
  }
}
