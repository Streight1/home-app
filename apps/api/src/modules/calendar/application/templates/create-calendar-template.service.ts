import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  CALENDAR_TEMPLATE_REPOSITORY,
  type CalendarTemplateRepository,
} from '../../domain/ports/calendar-template.repository.js';
import type { CalendarTemplateDto } from '../../presentation/dto/calendar-template.dto.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';
import { CalendarTemplateValidationService } from './calendar-template-validation.service.js';

@Injectable()
export class CreateCalendarTemplateService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_TEMPLATE_REPOSITORY)
    private readonly templates: CalendarTemplateRepository,
    private readonly validation: CalendarTemplateValidationService,
    private readonly responses: CalendarResponseMapper,
  ) {}
  public async execute(userId: string, input: CalendarTemplateDto) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    return this.responses.template(
      await this.templates.create({
        householdId: membership.householdId,
        userId,
        template: await this.validation.template(
          membership.householdId,
          input,
          userId,
        ),
      }),
    );
  }
}
