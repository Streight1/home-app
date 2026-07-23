import { Injectable } from '@nestjs/common';
import { TasksFacade } from '../../../tasks/tasks.facade.js';
import type {
  CalendarFeedItem,
  CalendarFeedSourcePort,
} from '../../domain/ports/calendar-feed-source.port.js';

@Injectable()
export class TaskCalendarSource implements CalendarFeedSourcePort {
  public constructor(private readonly tasks: TasksFacade) {}
  public async list(input: Parameters<CalendarFeedSourcePort['list']>[0]) {
    return (
      await this.tasks.calendarFeed(
        input.userId,
        input.householdId,
        input.from,
        input.to,
      )
    ).map((item): CalendarFeedItem => ({ sourceType: 'TASK', ...item }));
  }
}
