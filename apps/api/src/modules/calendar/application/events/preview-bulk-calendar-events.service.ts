import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';

@Injectable()
export class PreviewBulkCalendarEventsService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
  ) {}

  public async execute(userId: string, eventIds: string[]) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const events = await this.events.findManyByIds(
      membership.householdId,
      eventIds,
    );
    if (events.length !== eventIds.length) throw calendarNotFound();
    return {
      eventCount: events.length,
      taskEventCount: events.filter(({ source }) => source === 'TASK').length,
      templateEventCount: events.filter(({ source }) => source === 'TEMPLATE')
        .length,
    };
  }
}
