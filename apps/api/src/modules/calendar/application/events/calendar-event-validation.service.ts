import { Inject, Injectable } from '@nestjs/common';
import { isValidTimezone } from '../../../../common/time/zoned-date.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { parseCalendarDate } from '../../domain/calendar-event-schedule.js';
import type {
  CalendarColorToken,
  CalendarEventRecord,
  CalendarEventType,
  CalendarEventWriteInput,
} from '../../domain/calendar.types.js';
import {
  calendarInvalidInput,
  calendarShiftConflict,
} from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import type { CreateCalendarEventDto } from '../../presentation/dto/create-calendar-event.dto.js';
import type { UpdateCalendarEventDto } from '../../presentation/dto/update-calendar-event.dto.js';

interface EventValidationInput {
  title: string;
  description?: string | null;
  type: CalendarEventType;
  startsAt?: string | null;
  endsAt?: string | null;
  allDayStartDate?: string | null;
  allDayEndDateExclusive?: string | null;
  desiredArrivalAt?: string | null;
  timezone: string;
  isAllDay: boolean;
  location?: string | null;
  locationPlaceId?: string | null;
  locationLabel?: string | null;
  locationNotes?: string | null;
  calculateTravel: boolean;
  colorToken?: CalendarColorToken | null;
  participantIds: string[];
  allowShiftConflict?: boolean;
}

@Injectable()
export class CalendarEventValidationService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
  ) {}

  public create(
    householdId: string,
    input: CreateCalendarEventDto,
  ): Promise<CalendarEventWriteInput> {
    return this.validate(householdId, input);
  }

  public update(
    householdId: string,
    input: UpdateCalendarEventDto,
    existing: CalendarEventRecord,
  ): Promise<CalendarEventWriteInput> {
    const isAllDay = input.isAllDay ?? existing.isAllDay;
    return this.validate(
      householdId,
      {
        title: input.title ?? existing.title,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        type: input.type ?? existing.type,
        startsAt:
          input.startsAt !== undefined
            ? input.startsAt
            : isAllDay
              ? null
              : (existing.startsAt?.toISOString() ?? null),
        endsAt:
          input.endsAt !== undefined
            ? input.endsAt
            : isAllDay
              ? null
              : (existing.endsAt?.toISOString() ?? null),
        allDayStartDate:
          input.allDayStartDate !== undefined
            ? input.allDayStartDate
            : isAllDay
              ? existing.allDayStartDate
              : null,
        allDayEndDateExclusive:
          input.allDayEndDateExclusive !== undefined
            ? input.allDayEndDateExclusive
            : isAllDay
              ? existing.allDayEndDateExclusive
              : null,
        desiredArrivalAt:
          input.desiredArrivalAt !== undefined
            ? input.desiredArrivalAt
            : isAllDay
              ? (existing.desiredArrivalAt?.toISOString() ?? null)
              : null,
        timezone: input.timezone ?? existing.timezone,
        isAllDay,
        location:
          input.location !== undefined ? input.location : existing.location,
        locationPlaceId:
          input.locationPlaceId !== undefined
            ? input.locationPlaceId
            : existing.locationPlaceId,
        locationLabel:
          input.locationLabel !== undefined
            ? input.locationLabel
            : existing.locationLabel,
        locationNotes:
          input.locationNotes !== undefined
            ? input.locationNotes
            : existing.locationNotes,
        calculateTravel: input.calculateTravel ?? existing.calculateTravel,
        colorToken:
          input.colorToken !== undefined
            ? input.colorToken
            : existing.colorToken,
        participantIds:
          input.participantIds ??
          existing.participants.map(({ user }) => user.id),
        allowShiftConflict: input.allowShiftConflict,
      },
      existing.id,
    );
  }

  private async validate(
    householdId: string,
    input: EventValidationInput,
    excludeEventId?: string,
  ): Promise<CalendarEventWriteInput> {
    if (!isValidTimezone(input.timezone))
      throw calendarInvalidInput('Časové pásmo není platné.');

    const schedule = this.schedule(input);
    const participantIds = [...new Set(input.participantIds)];
    await this.access.assertActiveMembers(householdId, participantIds);
    if (input.type === 'WORK_SHIFT' && participantIds.length !== 1)
      throw calendarInvalidInput(
        'Pracovní směna musí mít právě jednoho člena.',
      );
    if (input.type === 'WORK_SHIFT' && input.isAllDay)
      throw calendarInvalidInput('Pracovní směna musí mít konkrétní čas.');
    if (input.type === 'WORK_SHIFT' && schedule.startsAt) {
      const conflicts = await this.events.countShiftConflicts({
        householdId,
        participantIds,
        startsAt: schedule.startsAt,
        endsAt: schedule.endsAt,
        ...(excludeEventId ? { excludeEventId } : {}),
      });
      if (conflicts > 0 && !input.allowShiftConflict)
        throw calendarShiftConflict(conflicts);
    }

    const description = input.description?.trim();
    const location = input.location?.trim();
    const requestedLocationLabel = input.locationLabel?.trim();
    const locationLabel = requestedLocationLabel?.length
      ? requestedLocationLabel
      : location;
    const locationNotes = input.locationNotes?.trim();
    return {
      title: input.title.trim(),
      description: description?.length ? description : null,
      type: input.type,
      ...schedule,
      timezone: input.timezone,
      isAllDay: input.isAllDay,
      location: location?.length ? location : null,
      locationPlaceId: input.locationPlaceId ?? null,
      locationLabel: locationLabel?.length ? locationLabel : null,
      locationNotes: locationNotes?.length ? locationNotes : null,
      calculateTravel: input.calculateTravel,
      colorToken: input.colorToken ?? null,
      participants: participantIds.map((userId) => ({
        userId,
        role: input.type === 'WORK_SHIFT' ? 'ASSIGNEE' : 'ATTENDEE',
      })),
    };
  }

  private schedule(input: EventValidationInput) {
    if (!input.isAllDay) {
      const startsAt = input.startsAt ? new Date(input.startsAt) : null;
      const endsAt = input.endsAt ? new Date(input.endsAt) : null;
      if (
        !startsAt ||
        !endsAt ||
        !Number.isFinite(startsAt.getTime()) ||
        !Number.isFinite(endsAt.getTime())
      )
        throw calendarInvalidInput(
          'Časovaná událost vyžaduje platný začátek a konec.',
        );
      if (endsAt <= startsAt)
        throw calendarInvalidInput('Konec události musí být po jejím začátku.');
      return {
        startsAt,
        endsAt,
        allDayStartDate: null,
        allDayEndDateExclusive: null,
        desiredArrivalAt: null,
      };
    }

    const allDayStartDate = input.allDayStartDate
      ? parseCalendarDate(input.allDayStartDate)
      : null;
    const allDayEndDateExclusive = input.allDayEndDateExclusive
      ? parseCalendarDate(input.allDayEndDateExclusive)
      : null;
    if (!allDayStartDate || !allDayEndDateExclusive)
      throw calendarInvalidInput(
        'Celodenní událost vyžaduje datum začátku a konce.',
      );
    if (allDayEndDateExclusive <= allDayStartDate)
      throw calendarInvalidInput(
        'Konec celodenní události musí být po začátku.',
      );
    const desiredArrivalAt = input.desiredArrivalAt
      ? new Date(input.desiredArrivalAt)
      : null;
    if (desiredArrivalAt && !Number.isFinite(desiredArrivalAt.getTime()))
      throw calendarInvalidInput('Požadovaný čas příjezdu není platný.');
    return {
      startsAt: null,
      endsAt: null,
      allDayStartDate,
      allDayEndDateExclusive,
      desiredArrivalAt,
    };
  }
}
