import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  CALENDAR_TEMPLATE_REPOSITORY,
  type CalendarTemplateRepository,
} from '../../domain/ports/calendar-template.repository.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';

@Injectable()
export class ListCalendarTemplatesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_TEMPLATE_REPOSITORY)
    private readonly templates: CalendarTemplateRepository,
    private readonly responses: CalendarResponseMapper,
  ) {}
  public async execute(userId: string) {
    const membership = await this.access.getActiveMembership(userId);
    return {
      items: (await this.templates.list(membership.householdId)).map((item) =>
        this.responses.template(item),
      ),
    };
  }
}
