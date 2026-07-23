import { Injectable } from '@nestjs/common';
import {
  addIsoDateDays,
  isValidTimezone,
  localDateTimeCandidates,
} from '../../../../common/time/zoned-date.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';
import type {
  CalendarEventWriteInput,
  CalendarTemplateRecord,
  CalendarTemplateWriteInput,
} from '../../domain/calendar.types.js';
import type { CalendarTemplateDto } from '../../presentation/dto/calendar-template.dto.js';
import { EventLocationValidationService } from '../events/event-location-validation.service.js';

@Injectable()
export class CalendarTemplateValidationService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly locations: EventLocationValidationService,
  ) {}

  public async template(
    householdId: string,
    input: CalendarTemplateDto,
    userId: string,
  ): Promise<CalendarTemplateWriteInput> {
    if (!isValidTimezone(input.timezone))
      throw calendarInvalidInput('Časové pásmo šablony není platné.');
    if (input.endDayOffset === 0 && input.endLocalTime <= input.startLocalTime)
      throw calendarInvalidInput(
        'Konec ve stejném dni musí být později než začátek.',
      );
    const participantIds = [...new Set(input.participantIds)];
    await this.access.assertActiveMembers(householdId, participantIds);
    await this.locations.assertVisible(
      userId,
      householdId,
      input.locationPlaceId,
    );
    if (input.eventType === 'WORK_SHIFT' && participantIds.length !== 1)
      throw calendarInvalidInput('Šablona směny musí mít právě jednoho člena.');
    const description = input.description?.trim();
    const defaultLocation = input.defaultLocation?.trim();
    const locationLabel = input.locationLabel?.trim();
    return {
      name: input.name.trim(),
      title: input.title.trim(),
      description: description?.length ? description : null,
      eventType: input.eventType,
      startLocalTime: input.startLocalTime,
      endLocalTime: input.endLocalTime,
      endDayOffset: input.endDayOffset,
      timezone: input.timezone,
      isAllDay: input.isAllDay,
      defaultLocation: defaultLocation?.length ? defaultLocation : null,
      locationPlaceId: input.locationPlaceId ?? null,
      locationLabel: locationLabel?.length
        ? locationLabel
        : (defaultLocation ?? null),
      calculateTravel: input.calculateTravel,
      routeMode: input.routeMode,
      travelBufferMinutes: input.travelBufferMinutes,
      colorToken: input.colorToken,
      participants: participantIds.map((userId) => ({
        userId,
        role: input.eventType === 'WORK_SHIFT' ? 'ASSIGNEE' : 'ATTENDEE',
      })),
    };
  }

  public occurrence(
    template: CalendarTemplateRecord,
    date: string,
  ): { event: CalendarEventWriteInput; usedEarlierOffset: boolean } {
    const startCandidates = localDateTimeCandidates(
      date,
      template.startLocalTime,
      template.timezone,
    );
    const endDate = addIsoDateDays(date, template.endDayOffset);
    const endCandidates = localDateTimeCandidates(
      endDate,
      template.endLocalTime,
      template.timezone,
    );
    if (!startCandidates.length || !endCandidates.length)
      throw calendarInvalidInput(
        'Vybraný lokální čas při přechodu na letní čas neexistuje. Upravte čas šablony.',
      );
    const startsAt = startCandidates[0];
    const endsAt = endCandidates[0];
    if (!startsAt || !endsAt || endsAt <= startsAt)
      throw calendarInvalidInput('Výsledný konec musí být po začátku.');
    return {
      event: {
        title: template.title,
        description: template.description,
        type: template.eventType,
        startsAt,
        endsAt,
        timezone: template.timezone,
        isAllDay: template.isAllDay,
        location: template.defaultLocation,
        locationPlaceId: template.locationPlaceId,
        locationLabel: template.locationLabel ?? template.defaultLocation,
        locationNotes: null,
        calculateTravel: template.calculateTravel,
        colorToken: template.colorToken,
        participants: template.participants,
      },
      usedEarlierOffset: startCandidates.length > 1 || endCandidates.length > 1,
    };
  }
}
