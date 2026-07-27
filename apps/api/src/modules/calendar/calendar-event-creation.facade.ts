import { Inject, Injectable } from '@nestjs/common';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from './domain/ports/calendar-event.repository.js';
import { CalendarTravelPlanService } from './application/travel/calendar-travel-plan.service.js';
import type { TravelRouteMode } from '../location/travel-estimation.facade.js';

@Injectable()
export class CalendarEventCreationFacade {
  public constructor(
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    private readonly travel: CalendarTravelPlanService,
  ) {}

  public async createTaskLinkedEvent(input: {
    householdId: string;
    userId: string;
    taskId: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    participantIds: string[];
    locationPlaceId: string | null;
    locationLabel: string | null;
    routeMode: TravelRouteMode;
    travelBufferMinutes: number;
    considerTravel: boolean;
  }) {
    const event = await this.events.createTaskLinked({
      householdId: input.householdId,
      userId: input.userId,
      taskId: input.taskId,
      event: {
        title: input.title,
        description: null,
        type: 'HOUSEHOLD',
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        allDayStartDate: null,
        allDayEndDateExclusive: null,
        desiredArrivalAt: null,
        timezone: input.timezone,
        isAllDay: false,
        location: input.locationLabel,
        locationPlaceId: input.locationPlaceId,
        locationLabel: input.locationLabel,
        locationNotes: null,
        calculateTravel: Boolean(input.locationPlaceId && input.considerTravel),
        colorToken: null,
        participants: input.participantIds.map((userId) => ({
          userId,
          role: 'ATTENDEE' as const,
        })),
      },
    });
    if (event.locationPlaceId && input.considerTravel) {
      try {
        await this.travel.configureAutoForEvent(input.userId, event, {
          routeMode: input.routeMode,
          travelBufferMinutes: input.travelBufferMinutes,
        });
      } catch {
        // The event-link transaction is already complete; travel can be retried.
      }
    }
    return {
      eventId: event.id,
      startsAt: event.startsAt?.toISOString() ?? input.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? input.endsAt.toISOString(),
    };
  }

  public removeTaskLinkedEvent(input: {
    householdId: string;
    userId: string;
    taskId: string;
    calendarEventId: string;
  }) {
    return this.events.removeTaskLinked({
      ...input,
      removedAt: new Date(),
    });
  }
}
