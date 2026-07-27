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
import type { BulkApplyCalendarTemplateDto } from '../../presentation/dto/calendar-template.dto.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';
import { CalendarTemplateValidationService } from './calendar-template-validation.service.js';
import { CalendarTravelPlanService } from '../travel/calendar-travel-plan.service.js';

@Injectable()
export class BulkApplyCalendarTemplateService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_TEMPLATE_REPOSITORY)
    private readonly templates: CalendarTemplateRepository,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly calendarEvents: CalendarEventRepository,
    private readonly validation: CalendarTemplateValidationService,
    private readonly responses: CalendarResponseMapper,
    private readonly travel: CalendarTravelPlanService,
  ) {}
  public async execute(
    userId: string,
    templateId: string,
    input: BulkApplyCalendarTemplateDto,
  ) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const template = await this.templates.findById(
      membership.householdId,
      templateId,
    );
    if (!template) throw calendarTemplateNotFound();
    const occurrences = input.dates
      .slice()
      .sort()
      .map((date) => this.validation.occurrence(template, date));
    let conflicts = 0;
    for (const occurrence of occurrences)
      conflicts += await this.conflicts(
        membership.householdId,
        occurrence.event,
      );
    if (conflicts > 0 && !input.allowShiftConflicts)
      throw calendarShiftConflict(conflicts);
    const result = await this.templates.apply({
      householdId: membership.householdId,
      userId,
      templateId,
      events: occurrences.map(({ event }) => event),
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
      eventCount: result.events.length,
      conflicts,
      travelEstimateWarnings: travelEstimates.filter(
        ({ status }) => status === 'rejected',
      ).length,
      events: result.events.map((event) => this.responses.event(event)),
      dstAmbiguityPolicy: occurrences.some(
        ({ usedEarlierOffset }) => usedEarlierOffset,
      )
        ? 'EARLIER_OFFSET'
        : null,
    };
  }
  private conflicts(householdId: string, event: CalendarEventWriteInput) {
    return event.type === 'WORK_SHIFT' && event.startsAt && event.endsAt
      ? this.calendarEvents.countShiftConflicts({
          householdId,
          participantIds: event.participants.map(({ userId }) => userId),
          startsAt: event.startsAt,
          endsAt: event.endsAt,
        })
      : Promise.resolve(0);
  }
}
