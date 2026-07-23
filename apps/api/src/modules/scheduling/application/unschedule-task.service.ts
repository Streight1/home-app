import { Inject, Injectable } from '@nestjs/common';
import { CalendarEventCreationFacade } from '../../calendar/calendar-event-creation.facade.js';
import { TasksFacade } from '../../tasks/tasks.facade.js';
import {
  TASK_CALENDAR_LINK_REPOSITORY,
  type TaskCalendarLinkRepository,
} from '../domain/ports/task-calendar-link.repository.js';
import { slotChanged } from '../domain/scheduling.errors.js';

@Injectable()
export class UnscheduleTaskService {
  public constructor(
    private readonly tasks: TasksFacade,
    private readonly calendar: CalendarEventCreationFacade,
    @Inject(TASK_CALENDAR_LINK_REPOSITORY)
    private readonly links: TaskCalendarLinkRepository,
  ) {}
  public async execute(userId: string, taskId: string) {
    const task = await this.tasks.getOwnershipSummary(userId, taskId);
    const link = await this.links.findActive(task.householdId, taskId);
    if (!link) throw slotChanged();
    const removed = await this.calendar.removeTaskLinkedEvent({
      householdId: task.householdId,
      userId,
      taskId,
      calendarEventId: link.calendarEventId,
    });
    if (!removed) throw slotChanged();
  }
}
