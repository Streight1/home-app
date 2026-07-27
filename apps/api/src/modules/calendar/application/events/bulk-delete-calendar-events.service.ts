import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import { PreviewBulkCalendarEventsService } from './preview-bulk-calendar-events.service.js';

@Injectable()
export class BulkDeleteCalendarEventsService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly preview: PreviewBulkCalendarEventsService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
  ) {}

  public async execute(userId: string, eventIds: string[]) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const impact = await this.preview.execute(userId, eventIds);
    const deletedCount = await this.events.bulkDelete({
      householdId: membership.householdId,
      userId,
      eventIds,
      deletedAt: new Date(),
      taskEventCount: impact.taskEventCount,
      templateEventCount: impact.templateEventCount,
    });
    if (deletedCount !== eventIds.length) throw calendarNotFound();
    return { deletedCount, ...impact };
  }
}
