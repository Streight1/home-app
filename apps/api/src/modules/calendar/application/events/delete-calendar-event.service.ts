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

@Injectable()
export class DeleteCalendarEventService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    @Inject(CALENDAR_CLOCK_PORT)
    private readonly clock: CalendarClockPort,
  ) {}
  public async execute(userId: string, eventId: string): Promise<void> {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const deleted = await this.events.delete({
      householdId: membership.householdId,
      userId,
      eventId,
      deletedAt: this.clock.now(),
    });
    if (!deleted) throw calendarNotFound();
  }
}
