import { Inject, Injectable } from '@nestjs/common';
import {
  isValidTimezone,
  zonedDayBounds,
} from '../../../../common/time/zoned-date.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import {
  CALENDAR_CLOCK_PORT,
  type CalendarClockPort,
} from '../../domain/ports/clock.port.js';
import { CalendarTravelPlanService } from '../travel/calendar-travel-plan.service.js';
import { getCalendarEventBounds } from '../../domain/calendar-event-schedule.js';
import { CalendarEventVisualService } from '../mappers/calendar-event-visual.service.js';

@Injectable()
export class GetTodayCalendarSummaryService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    @Inject(CALENDAR_CLOCK_PORT) private readonly clock: CalendarClockPort,
    private readonly travel: CalendarTravelPlanService,
    private readonly visuals: CalendarEventVisualService,
  ) {}
  public async execute(userId: string, timezone: string) {
    if (!isValidTimezone(timezone))
      throw calendarInvalidInput('Časové pásmo není platné.');
    const membership = await this.access.getActiveMembership(userId);
    const now = this.clock.now();
    const bounds = zonedDayBounds(now, timezone);
    const events = await this.events.today(
      membership.householdId,
      bounds.start,
      new Date(bounds.end.getTime() + 1),
      7,
    );
    const travelByEvent = new Map(
      await Promise.all(
        events.map(
          async (event) =>
            [
              event.id,
              event.calculateTravel
                ? await this.travel
                    .list(userId, event.id)
                    .then(({ items }) => items)
                    .catch(() => [])
                : [],
            ] as const,
        ),
      ),
    );
    return {
      summary: {
        total: events.length,
        ongoingTotal: events.filter((event) => {
          const eventBounds = getCalendarEventBounds(event);
          return eventBounds.start <= now && eventBounds.end > now;
        }).length,
      },
      items: events.map((event) => {
        const eventBounds = getCalendarEventBounds(event);
        return {
          id: event.id,
          title: event.title,
          type: event.type,
          startsAt: event.startsAt?.toISOString() ?? null,
          endsAt: event.endsAt?.toISOString() ?? null,
          allDayStartDate: event.allDayStartDate,
          allDayEndDateExclusive: event.allDayEndDateExclusive,
          timezone: event.timezone,
          isAllDay: event.isAllDay,
          colorToken: event.colorToken,
          visual: this.visuals.resolve(event),
          isOngoing: eventBounds.start <= now && eventBounds.end > now,
          spansMidnight:
            eventBounds.start < bounds.start || eventBounds.end > bounds.end,
          participants: event.participants.map(({ user }) => user),
          locationLabel: event.locationLabel ?? event.location,
          travelPlans: (travelByEvent.get(event.id) ?? []).map((plan) => ({
            travelerUserId: plan.travelerUserId,
            status: plan.status,
            routeMode: plan.routeMode,
            departureAt: plan.departureAt,
            durationSeconds: plan.durationSeconds,
            distanceMeters: plan.distanceMeters,
            origin: plan.origin,
            hasConflict: plan.conflict.hasConflict,
            missingSeconds: plan.conflict.missingSeconds,
            canRecalculate: membership.role !== 'VIEWER',
          })),
          navigationTarget: {
            area: 'calendar',
            screen: 'detail',
            eventId: event.id,
          },
        };
      }),
    };
  }
}
