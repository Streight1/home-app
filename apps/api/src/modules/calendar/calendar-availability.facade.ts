import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../households/household-access.service.js';

export interface CalendarAvailabilityEvent {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  locationPlaceId: string | null;
  updatedAt: Date;
}

@Injectable()
export class CalendarAvailabilityFacade {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly prisma: PrismaService,
  ) {}

  public async loadParticipantAvailability(input: {
    userId: string;
    householdId: string;
    participantIds: string[];
    from: Date;
    to: Date;
  }) {
    await this.access.assertMembership(input.userId, input.householdId);
    const memberships = await this.prisma.householdMember.findMany({
      where: {
        householdId: input.householdId,
        userId: { in: input.participantIds },
        user: { status: 'ACTIVE' },
      },
      select: { userId: true },
    });
    if (memberships.length !== new Set(input.participantIds).size)
      throw new Error('SCHEDULING_PARTICIPANT_NOT_AVAILABLE');
    const [events, preferences] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          householdId: input.householdId,
          status: 'ACTIVE',
          deletedAt: null,
          participants: { some: { userId: { in: input.participantIds } } },
          startsAt: { lt: new Date(input.to.getTime() + 24 * 60 * 60_000) },
          endsAt: { gt: new Date(input.from.getTime() - 24 * 60 * 60_000) },
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          locationPlaceId: true,
          updatedAt: true,
          participants: { select: { userId: true } },
        },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.calendarUserPreference.findMany({
        where: {
          householdId: input.householdId,
          userId: { in: input.participantIds },
        },
        select: { userId: true, defaultPlaceId: true },
      }),
    ]);
    const defaultPlaces = new Map(
      preferences.map((preference) => [
        preference.userId,
        preference.defaultPlaceId,
      ]),
    );
    return {
      participants: input.participantIds.map((participantId) => ({
        userId: participantId,
        defaultPlaceId: defaultPlaces.get(participantId) ?? null,
        events: events
          .filter((event) =>
            event.participants.some(
              (participant) => participant.userId === participantId,
            ),
          )
          .map((event) => ({
            id: event.id,
            title: event.title,
            startsAt: event.startsAt,
            endsAt: event.endsAt,
            locationPlaceId: event.locationPlaceId,
            updatedAt: event.updatedAt,
          })),
      })),
      version: createHash('sha256')
        .update(
          JSON.stringify({
            events: events.map((event) => [
              event.id,
              event.updatedAt.toISOString(),
            ]),
            preferences: preferences.map((preference) => [
              preference.userId,
              preference.defaultPlaceId,
            ]),
          }),
        )
        .digest('base64url'),
    };
  }
}
