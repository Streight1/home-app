import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarTemplateNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_TEMPLATE_REPOSITORY,
  type CalendarTemplateRepository,
} from '../../domain/ports/calendar-template.repository.js';

@Injectable()
export class DeleteCalendarTemplateService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_TEMPLATE_REPOSITORY)
    private readonly templates: CalendarTemplateRepository,
  ) {}
  public async execute(userId: string, templateId: string): Promise<void> {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    if (
      !(await this.templates.delete({
        householdId: membership.householdId,
        userId,
        templateId,
      }))
    )
      throw calendarTemplateNotFound();
  }
}
