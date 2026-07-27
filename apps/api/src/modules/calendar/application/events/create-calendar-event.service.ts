import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import type { CreateCalendarEventDto } from '../../presentation/dto/create-calendar-event.dto.js';
import { CalendarResponseMapper } from '../mappers/calendar-response.mapper.js';
import { CalendarEventValidationService } from './calendar-event-validation.service.js';
import { EventLocationValidationService } from './event-location-validation.service.js';
import { CalendarTravelPlanService } from '../travel/calendar-travel-plan.service.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';
import { CalendarPreferencesService } from '../../../location/application/preferences/calendar-preferences.service.js';
import { getCalendarTravelTarget } from '../../domain/calendar-event-schedule.js';

@Injectable()
export class CreateCalendarEventService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    private readonly validation: CalendarEventValidationService,
    private readonly responses: CalendarResponseMapper,
    private readonly locations: EventLocationValidationService,
    private readonly travel: CalendarTravelPlanService,
    private readonly preferences: CalendarPreferencesService,
  ) {}
  public async execute(userId: string, input: CreateCalendarEventDto) {
    if (
      input.travelPlan?.originMode === 'PREVIOUS_EVENT' &&
      !input.travelPlan.allowTravelConflict
    )
      throw calendarInvalidInput(
        'Potvrďte, že chcete použít předchozí událost a případný nedostatek času.',
      );
    if (
      input.travelPlan &&
      !input.participantIds.includes(input.travelPlan.travelerUserId)
    )
      throw calendarInvalidInput(
        'Cestu lze plánovat pouze pro vybraného účastníka.',
      );
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    await this.locations.assertVisible(
      userId,
      membership.householdId,
      input.locationPlaceId,
    );
    const event = await this.events.create({
      householdId: membership.householdId,
      userId,
      event: await this.validation.create(membership.householdId, input),
    });
    if (event.type === 'WORK_SHIFT' && event.participants[0])
      await this.preferences.rememberLastWorkShiftParticipant(
        userId,
        event.participants[0].user.id,
      );
    const response = this.responses.event(event);
    if (
      !input.travelPlan &&
      (!input.calculateTravel ||
        !event.locationPlaceId ||
        !getCalendarTravelTarget(event))
    )
      return response;
    try {
      let travelPlans = await this.travel.configureAutoForEvent(userId, event);
      if (input.travelPlan) {
        await this.travel.configure(
          userId,
          event.id,
          input.travelPlan.travelerUserId,
          input.travelPlan,
        );
        travelPlans = (await this.travel.list(userId, event.id)).items;
      }
      return { ...response, travelPlans };
    } catch {
      return {
        ...response,
        travelPlan: null,
        travelPlanWarning:
          'Odhad cesty se nepodařilo uložit. Událost zůstala vytvořená.',
      };
    }
  }
}
