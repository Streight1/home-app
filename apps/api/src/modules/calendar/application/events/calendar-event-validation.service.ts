import { Inject, Injectable } from '@nestjs/common';
import { isValidTimezone } from '../../../../common/time/zoned-date.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import type {
  CalendarEventRecord,
  CalendarEventWriteInput,
  CalendarEventType,
  CalendarColorToken,
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

@Injectable()
export class CalendarEventValidationService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
  ) {}

  public async create(
    householdId: string,
    input: CreateCalendarEventDto,
  ): Promise<CalendarEventWriteInput> {
    return this.validate(householdId, input);
  }

  public async update(
    householdId: string,
    input: UpdateCalendarEventDto,
    existing: CalendarEventRecord,
  ): Promise<CalendarEventWriteInput> {
    return this.validate(
      householdId,
      {
        title: input.title ?? existing.title,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        type: input.type ?? existing.type,
        startsAt: input.startsAt ?? existing.startsAt.toISOString(),
        endsAt: input.endsAt ?? existing.endsAt.toISOString(),
        timezone: input.timezone ?? existing.timezone,
        isAllDay: input.isAllDay ?? existing.isAllDay,
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
        colorToken: input.colorToken ?? existing.colorToken,
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
    input: {
      title: string;
      description?: string | null;
      type: CalendarEventType;
      startsAt: string;
      endsAt: string;
      timezone: string;
      isAllDay: boolean;
      location?: string | null;
      locationPlaceId?: string | null;
      locationLabel?: string | null;
      locationNotes?: string | null;
      calculateTravel: boolean;
      colorToken: CalendarColorToken;
      participantIds: string[];
      allowShiftConflict?: boolean;
    },
    excludeEventId?: string,
  ): Promise<CalendarEventWriteInput> {
    if (!isValidTimezone(input.timezone))
      throw calendarInvalidInput('Časové pásmo není platné.');
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (
      !Number.isFinite(startsAt.getTime()) ||
      !Number.isFinite(endsAt.getTime())
    )
      throw calendarInvalidInput('Datum události není platné.');
    if (endsAt <= startsAt)
      throw calendarInvalidInput('Konec události musí být po jejím začátku.');
    const participantIds = [...new Set(input.participantIds)];
    await this.access.assertActiveMembers(householdId, participantIds);
    if (input.type === 'WORK_SHIFT' && participantIds.length !== 1)
      throw calendarInvalidInput(
        'Pracovní směna musí mít právě jednoho člena.',
      );
    if (input.type === 'WORK_SHIFT') {
      const conflicts = await this.events.countShiftConflicts({
        householdId,
        participantIds,
        startsAt,
        endsAt,
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
      startsAt,
      endsAt,
      timezone: input.timezone,
      isAllDay: input.isAllDay,
      location: location?.length ? location : null,
      locationPlaceId: input.locationPlaceId ?? null,
      locationLabel: locationLabel?.length ? locationLabel : null,
      locationNotes: locationNotes?.length ? locationNotes : null,
      calculateTravel: input.calculateTravel,
      colorToken: input.colorToken,
      participants: participantIds.map((userId) => ({
        userId,
        role: input.type === 'WORK_SHIFT' ? 'ASSIGNEE' : 'ATTENDEE',
      })),
    };
  }
}
