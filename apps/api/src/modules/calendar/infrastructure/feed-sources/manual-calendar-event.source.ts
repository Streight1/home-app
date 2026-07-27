import { Inject, Injectable } from '@nestjs/common';
import { CalendarTravelPlanService } from '../../application/travel/calendar-travel-plan.service.js';
import { CalendarEventVisualService } from '../../application/mappers/calendar-event-visual.service.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import type {
  CalendarFeedItem,
  CalendarFeedSourcePort,
} from '../../domain/ports/calendar-feed-source.port.js';

@Injectable()
export class ManualCalendarEventSource implements CalendarFeedSourcePort {
  public constructor(
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    private readonly travel: CalendarTravelPlanService,
    private readonly visuals: CalendarEventVisualService = new CalendarEventVisualService(),
  ) {}

  public async list(input: Parameters<CalendarFeedSourcePort['list']>[0]) {
    const events = await this.events.list(
      input.householdId,
      input.from,
      input.to,
    );
    const eventItems = events.flatMap((event): CalendarFeedItem[] => {
      const start = event.isAllDay
        ? event.allDayStartDate
        : event.startsAt?.toISOString();
      const end = event.isAllDay
        ? event.allDayEndDateExclusive
        : event.endsAt?.toISOString();
      if (!start || !end) return [];
      const visual = this.visuals.resolve(event);
      return [
        {
          sourceType: 'CALENDAR_EVENT',
          id: event.id,
          title: event.title,
          start,
          end,
          status: event.status,
          eventType: event.type,
          colorToken: visual.colorToken,
          visual,
          isAllDay: event.isAllDay,
          participants: event.participants.map(({ user }) => ({
            id: user.id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            calendarColorToken: user.calendarColorToken,
          })),
          locationLabel: event.locationLabel ?? event.location,
          taskLink: event.taskLink
            ? {
                ...event.taskLink,
                canComplete:
                  input.canMutate && event.taskLink.status === 'OPEN',
              }
            : null,
          navigationTarget: {
            area: 'calendar',
            screen: 'detail',
            eventId: event.id,
          },
        },
      ];
    });
    const travelItems = (
      await Promise.all(
        events
          .filter((event) => event.calculateTravel)
          .map((event) =>
            this.travel
              .list(input.userId, event.id)
              .then(({ items }) => ({ event, items }))
              .catch(() => ({ event, items: [] })),
          ),
      )
    ).flatMap(({ event, items }): CalendarFeedItem[] =>
      items.flatMap((plan) =>
        plan.status === 'READY' &&
        plan.departureAt &&
        plan.durationSeconds !== null &&
        plan.distanceMeters !== null
          ? (() => {
              const arrivalAt = new Date(
                new Date(plan.departureAt).getTime() +
                  plan.durationSeconds * 1000,
              );
              const traveler = event.participants.find(
                ({ user }) => user.id === plan.travelerUserId,
              )?.user;
              return [
                {
                  sourceType: 'TRAVEL_BLOCK',
                  id: plan.id,
                  eventId: event.id,
                  travelerUserId: plan.travelerUserId,
                  title: `Cesta na ${event.title}`,
                  eventTitle: event.title,
                  start: plan.departureAt,
                  end: arrivalAt.toISOString(),
                  eventStartsAt:
                    event.desiredArrivalAt?.toISOString() ??
                    event.startsAt?.toISOString() ??
                    plan.departureAt,
                  status: plan.status,
                  routeMode: plan.routeMode,
                  durationSeconds: plan.durationSeconds,
                  distanceMeters: plan.distanceMeters,
                  bufferMinutes: plan.travelBufferMinutes,
                  hasConflict: plan.conflict.hasConflict,
                  missingSeconds: plan.conflict.missingSeconds,
                  traveler: traveler
                    ? {
                        id: traveler.id,
                        displayName: traveler.displayName,
                        avatarUrl: traveler.avatarUrl,
                      }
                    : null,
                  navigationTarget: {
                    area: 'calendar',
                    screen: 'detail',
                    eventId: event.id,
                  },
                },
              ];
            })()
          : [],
      ),
    );
    return [...eventItems, ...travelItems];
  }
}
