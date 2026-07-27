import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  calendarShiftConflict,
  calendarTemplateNotFound,
} from '../../domain/calendar.errors.js';
import type { CalendarEventWriteInput } from '../../domain/calendar.types.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import {
  CALENDAR_TEMPLATE_REPOSITORY,
  type CalendarTemplateRepository,
} from '../../domain/ports/calendar-template.repository.js';
import type { ApplyCalendarTemplateDto } from '../../presentation/dto/calendar-template.dto.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';
import { CalendarTemplateValidationService } from './calendar-template-validation.service.js';
import { CalendarTravelPlanService } from '../travel/calendar-travel-plan.service.js';

@Injectable()
export class ApplyCalendarTemplateService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_TEMPLATE_REPOSITORY)
    private readonly templates: CalendarTemplateRepository,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    private readonly validation: CalendarTemplateValidationService,
    private readonly responses: CalendarResponseMapper,
    private readonly travel: CalendarTravelPlanService,
  ) {}
  public async execute(
    userId: string,
    templateId: string,
    input: ApplyCalendarTemplateDto,
  ) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const template = await this.templates.findById(
      membership.householdId,
      templateId,
    );
    if (!template) throw calendarTemplateNotFound();
    const occurrence = this.validation.occurrence(template, input.date);
    const conflictCount = await this.conflicts(
      membership.householdId,
      occurrence.event,
    );
    if (conflictCount > 0 && !input.allowShiftConflicts)
      throw calendarShiftConflict(conflictCount);
    const result = await this.templates.apply({
      householdId: membership.householdId,
      userId,
      templateId,
      events: [occurrence.event],
    });
    const travelEstimates = await Promise.allSettled(
      result.events
        .filter((event) => event.calculateTravel && event.locationPlaceId)
        .map((event) =>
          this.travel.configureAutoForEvent(userId, event, {
            routeMode: template.routeMode,
            travelBufferMinutes: template.travelBufferMinutes,
          }),
        ),
    );
    return {
      batchId: result.batchId,
      events: result.events.map((event) => this.responses.event(event)),
      conflicts: conflictCount,
      travelEstimateWarnings: travelEstimates.filter(
        ({ status }) => status === 'rejected',
      ).length,
      dstAmbiguityPolicy: occurrence.usedEarlierOffset
        ? 'EARLIER_OFFSET'
        : null,
    };
  }
  private conflicts(householdId: string, event: CalendarEventWriteInput) {
    return event.type === 'WORK_SHIFT' && event.startsAt && event.endsAt
      ? this.events.countShiftConflicts({
          householdId,
          participantIds: event.participants.map(({ userId }) => userId),
          startsAt: event.startsAt,
          endsAt: event.endsAt,
        })
      : Promise.resolve(0);
  }
}
