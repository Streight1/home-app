import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';

@Injectable()
export class GetCalendarEventService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    private readonly responses: CalendarResponseMapper,
  ) {}
  public async execute(userId: string, eventId: string) {
    const membership = await this.access.getActiveMembership(userId);
    const event = await this.events.findById(membership.householdId, eventId);
    if (!event) throw calendarNotFound();
    const response = this.responses.event(event);
    return {
      ...response,
      permissions: {
        canEdit: membership.role !== 'VIEWER' && event.source !== 'TASK',
        canCancel: membership.role !== 'VIEWER' && event.source !== 'TASK',
        canDelete: membership.role !== 'VIEWER',
        canCompleteTask:
          membership.role !== 'VIEWER' && event.taskLink?.status === 'OPEN',
      },
    };
  }
}
