import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';

@Injectable()
export class ListPreviousEventsService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
  ) {}
  public async execute(
    userId: string,
    eventId: string,
    travelerUserId: string,
  ) {
    const membership = await this.access.getActiveMembership(userId);
    const target = await this.events.findById(membership.householdId, eventId);
    if (!target) throw calendarNotFound();
    const from = new Date(target.startsAt.getTime() - 24 * 60 * 60_000);
    const items = (
      await this.events.list(membership.householdId, from, target.startsAt)
    )
      .filter(
        (event) =>
          event.id !== target.id &&
          event.status === 'ACTIVE' &&
          event.endsAt <= target.startsAt &&
          event.locationPlaceId &&
          event.participants.some(({ user }) => user.id === travelerUserId),
      )
      .sort((left, right) => right.endsAt.getTime() - left.endsAt.getTime())
      .slice(0, 8)
      .map((event) => ({
        id: event.id,
        title: event.title,
        endsAt: event.endsAt.toISOString(),
        locationLabel: event.locationLabel ?? event.location,
      }));
    return { items };
  }
}
