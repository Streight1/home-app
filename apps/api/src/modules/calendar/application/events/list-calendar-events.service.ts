import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';

@Injectable()
export class ListCalendarEventsService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    private readonly responses: CalendarResponseMapper,
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
    const canMutate = membership.role !== 'VIEWER';
    return {
      items: (await this.events.list(membership.householdId, from, to)).map(
        (event) => ({
          ...this.responses.event(event),
          permissions: {
            canEdit: canMutate,
            canCancel: canMutate,
            canDelete: canMutate,
          },
        }),
      ),
    };
  }
}
