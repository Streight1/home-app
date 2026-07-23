import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';
import { TaskCalendarSource } from '../../infrastructure/feed-sources/task-calendar.source.js';
import { ManualCalendarEventSource } from '../../infrastructure/feed-sources/manual-calendar-event.source.js';

@Injectable()
export class GetCalendarFeedService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly manualEvents: ManualCalendarEventSource,
    private readonly tasks: TaskCalendarSource,
  ) {}
  public async execute(userId: string, fromValue: string, toValue: string) {
    const from = new Date(fromValue);
    const to = new Date(toValue);
    if (
      !Number.isFinite(from.getTime()) ||
      !Number.isFinite(to.getTime()) ||
      to <= from
    )
      throw calendarInvalidInput('Rozsah kalendáře není platný.');
    if (to.getTime() - from.getTime() > 370 * 86_400_000)
      throw calendarInvalidInput('Rozsah kalendáře může být nejvýše 370 dní.');
    const membership = await this.access.getActiveMembership(userId);
    const input = {
      userId,
      householdId: membership.householdId,
      from,
      to,
      canMutate: membership.role !== 'VIEWER',
    };
    const [events, tasks] = await Promise.all([
      this.manualEvents.list(input),
      this.tasks.list(input),
    ]);
    return {
      items: [...events, ...tasks].sort(
        (left, right) =>
          left.start.localeCompare(right.start) ||
          left.id.localeCompare(right.id),
      ),
    };
  }
}
