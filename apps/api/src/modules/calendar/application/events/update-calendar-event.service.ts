import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarNotFound } from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import type { UpdateCalendarEventDto } from '../../presentation/dto/update-calendar-event.dto.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';
import { CalendarEventValidationService } from './calendar-event-validation.service.js';
import { EventLocationValidationService } from './event-location-validation.service.js';
import { CalendarTravelPlanService } from '../travel/calendar-travel-plan.service.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';

@Injectable()
export class UpdateCalendarEventService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    private readonly validation: CalendarEventValidationService,
    private readonly responses: CalendarResponseMapper,
    private readonly locations: EventLocationValidationService,
    private readonly travel: CalendarTravelPlanService,
  ) {}
  public async execute(
    userId: string,
    eventId: string,
    input: UpdateCalendarEventDto,
  ) {
    if (
      input.travelPlan?.originMode === 'PREVIOUS_EVENT' &&
      !input.travelPlan.allowTravelConflict
    )
      throw calendarInvalidInput(
        'Potvrďte, že chcete použít předchozí událost a případný nedostatek času.',
      );
    if (
      input.travelPlan &&
      input.participantIds &&
      !input.participantIds.includes(input.travelPlan.travelerUserId)
    )
      throw calendarInvalidInput(
        'Cestu lze plánovat pouze pro vybraného účastníka.',
      );
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const existing = await this.events.findById(
      membership.householdId,
      eventId,
    );
    if (!existing) throw calendarNotFound();
    await this.locations.assertVisible(
      userId,
      membership.householdId,
      input.locationPlaceId,
    );
    const changedFields = Object.keys(input).filter(
      (key) => key !== 'allowShiftConflict' && key !== 'travelPlan',
    );
    const event = await this.events.update({
      householdId: membership.householdId,
      userId,
      eventId,
      event: await this.validation.update(
        membership.householdId,
        input,
        existing,
      ),
      changedFields,
    });
    if (!event) throw calendarNotFound();
    if (
      ['startsAt', 'locationPlaceId', 'locationLabel'].some((key) =>
        changedFields.includes(key),
      )
    )
      await this.travel.staleAfterEventChange(membership.householdId, eventId);
    const response = this.responses.event(event);
    if (!event.calculateTravel || !event.locationPlaceId) return response;
    const relevantChange = [
      'startsAt',
      'locationPlaceId',
      'participantIds',
      'calculateTravel',
    ].some((key) => changedFields.includes(key));
    if (!relevantChange && !input.travelPlan) return response;
    await this.travel.configureAutoForEvent(userId, event);
    if (input.travelPlan)
      await this.travel.configure(
        userId,
        event.id,
        input.travelPlan.travelerUserId,
        input.travelPlan,
      );
    return {
      ...response,
      travelPlans: (await this.travel.list(userId, event.id)).items,
    };
  }
}
