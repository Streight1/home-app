import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import {
  CALENDAR_CLOCK_PORT,
  type CalendarClockPort,
} from '../../domain/ports/clock.port.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';

@Injectable()
export class CancelCalendarEventService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    @Inject(CALENDAR_CLOCK_PORT) private readonly clock: CalendarClockPort,
    private readonly responses: CalendarResponseMapper,
  ) {}
  public async execute(userId: string, eventId: string) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const event = await this.events.cancel({
      householdId: membership.householdId,
      userId,
      eventId,
      now: this.clock.now(),
    });
    if (!event) throw calendarNotFound();
    return this.responses.event(event);
  }
}
