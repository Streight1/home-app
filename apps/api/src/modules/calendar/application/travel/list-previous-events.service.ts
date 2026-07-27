import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import {
  getCalendarEventBounds,
  getCalendarTravelTarget,
} from '../../domain/calendar-event-schedule.js';

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
    const targetAt = getCalendarTravelTarget(target);
    if (!targetAt) return { items: [] };
    const from = new Date(targetAt.getTime() - 24 * 60 * 60_000);
    const items = (
      await this.events.list(membership.householdId, from, targetAt)
    )
      .map((event) => ({ event, bounds: getCalendarEventBounds(event) }))
      .filter(
        ({ event, bounds }) =>
          event.id !== target.id &&
          event.status === 'ACTIVE' &&
          bounds.end <= targetAt &&
          event.locationPlaceId &&
          event.participants.some(({ user }) => user.id === travelerUserId),
      )
      .sort(
        (left, right) => right.bounds.end.getTime() - left.bounds.end.getTime(),
      )
      .slice(0, 8)
      .map(({ event, bounds }) => ({
        id: event.id,
        title: event.title,
        endsAt: bounds.end.toISOString(),
        locationLabel: event.locationLabel ?? event.location,
      }));
    return { items };
  }
}
