import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  calendarInvalidInput,
  calendarNotFound,
} from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import type { BulkUpdateCalendarEventsDto } from '../../presentation/dto/bulk-calendar-events.dto.js';
import { EventLocationValidationService } from './event-location-validation.service.js';

@Injectable()
export class BulkUpdateCalendarEventsService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly locations: EventLocationValidationService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
  ) {}

  public async execute(userId: string, input: BulkUpdateCalendarEventsDto) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const existing = await this.events.findManyByIds(
      membership.householdId,
      input.eventIds,
    );
    if (existing.length !== input.eventIds.length) throw calendarNotFound();
    const resultingShift =
      input.typeOperation === 'SET' && input.eventType === 'WORK_SHIFT';
    if (input.participantOperation !== 'UNCHANGED') {
      const participantIds = input.participantIds ?? [];
      await this.access.assertActiveMembers(
        membership.householdId,
        participantIds,
      );
      if (
        (resultingShift ||
          existing.some(({ type }) => type === 'WORK_SHIFT')) &&
        (input.participantOperation !== 'REPLACE' ||
          participantIds.length !== 1)
      )
        throw calendarInvalidInput(
          'Hromadná změna směn musí každé směně ponechat právě jednoho účastníka.',
        );
    }
    if (
      resultingShift &&
      (input.participantOperation !== 'REPLACE' ||
        (input.participantIds?.length ?? 0) !== 1 ||
        existing.some(({ isAllDay }) => isAllDay))
    )
      throw calendarInvalidInput(
        'Pracovní směna musí být časovaná a mít právě jednoho účastníka.',
      );
    if (
      input.locationOperation === 'SET' &&
      input.locationPlaceId === undefined
    )
      throw calendarInvalidInput('Vyberte cílové místo.');
    if (input.locationOperation === 'SET')
      await this.locations.assertVisible(
        userId,
        membership.householdId,
        input.locationPlaceId,
      );
    const changedFields = [
      input.colorOperation !== 'UNCHANGED' && 'colorToken',
      input.typeOperation !== 'UNCHANGED' && 'type',
      input.participantOperation !== 'UNCHANGED' && 'participants',
      input.locationOperation !== 'UNCHANGED' && 'location',
      input.calculateTravelOperation !== 'UNCHANGED' && 'calculateTravel',
      input.routeModeOperation !== 'UNCHANGED' && 'routeMode',
      input.travelBufferOperation !== 'UNCHANGED' && 'travelBufferMinutes',
    ].filter((value): value is string => Boolean(value));
    if (!changedFields.length)
      throw calendarInvalidInput('Vyberte alespoň jednu hromadnou změnu.');
    const bulkInput: Parameters<CalendarEventRepository['bulkUpdate']>[0] = {
      householdId: membership.householdId,
      userId,
      eventIds: input.eventIds,
      changedFields,
    };
    if (input.colorOperation === 'SET') {
      if (!input.colorToken)
        throw calendarInvalidInput('Vyberte barvu událostí.');
      bulkInput.colorToken = input.colorToken;
    } else if (input.colorOperation === 'REMOVE') bulkInput.colorToken = null;
    if (input.typeOperation === 'SET') {
      if (!input.eventType) throw calendarInvalidInput('Vyberte typ událostí.');
      bulkInput.eventType = input.eventType;
    }
    if (input.participantOperation !== 'UNCHANGED')
      bulkInput.participants = {
        operation: input.participantOperation,
        userIds: input.participantIds ?? [],
      };
    if (input.locationOperation === 'SET') {
      if (!input.locationPlaceId)
        throw calendarInvalidInput('Vyberte cílové místo.');
      bulkInput.location = {
        placeId: input.locationPlaceId,
        label: input.locationLabel?.trim() ?? null,
      };
    } else if (input.locationOperation === 'REMOVE')
      bulkInput.location = { placeId: null, label: null };
    if (input.calculateTravelOperation === 'SET') {
      if (input.calculateTravel === undefined)
        throw calendarInvalidInput('Vyberte nastavení odhadu cesty.');
      bulkInput.calculateTravel = input.calculateTravel;
    }
    if (input.routeModeOperation === 'SET') {
      if (!input.routeMode)
        throw calendarInvalidInput('Vyberte způsob dopravy.');
      bulkInput.routeMode = input.routeMode;
    }
    if (input.travelBufferOperation === 'SET') {
      if (input.travelBufferMinutes === undefined)
        throw calendarInvalidInput('Zadejte cestovní rezervu.');
      bulkInput.travelBufferMinutes = input.travelBufferMinutes;
    }
    const updated = await this.events.bulkUpdate(bulkInput);
    if (updated !== input.eventIds.length) throw calendarNotFound();
    return { updatedCount: updated, changedFields };
  }
}
