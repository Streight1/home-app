import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarBatchNotRevertible } from '../../domain/calendar.errors.js';
import {
  CALENDAR_TEMPLATE_REPOSITORY,
  type CalendarTemplateRepository,
} from '../../domain/ports/calendar-template.repository.js';
import {
  CALENDAR_CLOCK_PORT,
  type CalendarClockPort,
} from '../../domain/ports/clock.port.js';

@Injectable()
export class RevertCalendarTemplateBatchService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_TEMPLATE_REPOSITORY)
    private readonly templates: CalendarTemplateRepository,
    @Inject(CALENDAR_CLOCK_PORT) private readonly clock: CalendarClockPort,
  ) {}
  public async execute(userId: string, batchId: string): Promise<void> {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    if (
      !(await this.templates.revert({
        householdId: membership.householdId,
        userId,
        batchId,
        now: this.clock.now(),
      }))
    )
      throw calendarBatchNotRevertible();
  }
}
