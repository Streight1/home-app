import { Inject, Injectable } from '@nestjs/common';
import { CalendarPreferencesService } from '../../../location/application/preferences/calendar-preferences.service.js';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from '../../../location/domain/ports/saved-place.repository.js';
import type {
  SavedPlaceRecord,
  TravelOriginMode,
} from '../../../location/domain/location.types.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';
import type { CalendarEventRecord } from '../../domain/calendar.types.js';
import { getCalendarEventBounds } from '../../domain/calendar-event-schedule.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import {
  CALENDAR_TRAVEL_PLAN_REPOSITORY,
  type CalendarEventTravelPlanRepository,
} from '../../domain/travel/calendar-event-travel-plan.repository.js';

@Injectable()
export class ResolveTravelOriginService {
  public constructor(
    private readonly preferences: CalendarPreferencesService,
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    @Inject(CALENDAR_TRAVEL_PLAN_REPOSITORY)
    private readonly plans: CalendarEventTravelPlanRepository,
  ) {}
  public async execute(input: {
    userId: string;
    householdId: string;
    travelerUserId: string;
    target: Pick<CalendarEventRecord, 'id' | 'participants' | 'startsAt'>;
    originMode: TravelOriginMode;
    originPlaceId: string | null;
    previousEventId: string | null;
  }): Promise<{
    place: SavedPlaceRecord;
    previousEvent: CalendarEventRecord | null;
    source: 'DEFAULT_PLACE' | 'PREVIOUS_EVENT' | 'CUSTOM_PLACE';
  }> {
    const targetAt = input.target.startsAt;
    if (!targetAt)
      throw calendarInvalidInput(
        'Pro výpočet cesty chybí konkrétní čas příjezdu.',
      );
    if (input.originMode === 'AUTO') {
      const previous = await this.autoPrevious(input);
      if (previous) {
        const locationPlaceId = previous.locationPlaceId;
        if (!locationPlaceId)
          throw calendarInvalidInput(
            'Předchozí událost nemá routovatelný cíl.',
          );
        return {
          place: await this.requiredHouseholdPlace(
            input.householdId,
            locationPlaceId,
          ),
          previousEvent: previous,
          source: 'PREVIOUS_EVENT',
        };
      }
      return this.defaultPlace(input);
    }
    if (input.originMode === 'DEFAULT_PLACE') {
      return this.defaultPlace(input);
    }
    if (input.originMode === 'CUSTOM_PLACE') {
      if (!input.originPlaceId)
        throw calendarInvalidInput('Vyberte počáteční místo cesty.');
      return {
        place: await this.requiredPlace(input, input.originPlaceId),
        previousEvent: null,
        source: 'CUSTOM_PLACE',
      };
    }
    if (!input.previousEventId || input.previousEventId === input.target.id)
      throw calendarInvalidInput('Událost nelze navázat sama na sebe.');
    const previous = await this.events.findById(
      input.householdId,
      input.previousEventId,
    );
    if (
      !previous ||
      previous.status === 'CANCELLED' ||
      getCalendarEventBounds(previous).end > targetAt ||
      !previous.participants.some(
        ({ user }) => user.id === input.travelerUserId,
      ) ||
      !previous.locationPlaceId
    )
      throw calendarInvalidInput(
        'Předchozí událost nelze použít jako počátek cesty.',
      );
    await this.assertNoCycle(
      input.target.id,
      input.householdId,
      input.travelerUserId,
      previous.id,
    );
    return {
      place: await this.requiredPlace(input, previous.locationPlaceId),
      previousEvent: previous,
      source: 'PREVIOUS_EVENT',
    };
  }
  private async defaultPlace(input: {
    householdId: string;
    travelerUserId: string;
  }) {
    const preference = await this.preferences.get(input.travelerUserId);
    if (!preference.defaultPlaceId)
      throw calendarInvalidInput('Pro výpočet cesty nastavte výchozí místo.');
    const place = await this.places.findForOwner(
      input.householdId,
      input.travelerUserId,
      preference.defaultPlaceId,
    );
    if (!place) throw calendarInvalidInput('Výchozí místo není dostupné.');
    return {
      place,
      previousEvent: null,
      source: 'DEFAULT_PLACE' as const,
    };
  }
  private async autoPrevious(input: {
    householdId: string;
    travelerUserId: string;
    target: Pick<CalendarEventRecord, 'id' | 'participants' | 'startsAt'>;
  }) {
    const targetAt = input.target.startsAt;
    if (!targetAt) return null;
    const from = new Date(targetAt.getTime() - 8 * 60 * 60_000);
    const candidates = await this.events.list(
      input.householdId,
      from,
      targetAt,
    );
    return (
      candidates
        .map((event) => ({
          event,
          bounds: getCalendarEventBounds(event),
        }))
        .filter(
          ({ event, bounds }) =>
            event.id !== input.target.id &&
            event.status === 'ACTIVE' &&
            bounds.end <= targetAt &&
            event.locationPlaceId !== null &&
            event.participants.some(
              ({ user }) => user.id === input.travelerUserId,
            ),
        )
        .sort(
          (left, right) =>
            right.bounds.end.getTime() - left.bounds.end.getTime(),
        )[0]?.event ?? null
    );
  }
  private async requiredPlace(
    input: { userId: string; householdId: string },
    placeId: string,
  ) {
    const place = await this.places.findVisible(
      input.householdId,
      input.userId,
      placeId,
    );
    if (!place) throw calendarInvalidInput('Počáteční místo není dostupné.');
    return place;
  }
  private async requiredHouseholdPlace(householdId: string, placeId: string) {
    const place = await this.places.findInHousehold(householdId, placeId);
    if (!place) throw calendarInvalidInput('Počáteční místo není dostupné.');
    return place;
  }
  private async assertNoCycle(
    targetEventId: string,
    householdId: string,
    travelerUserId: string,
    firstPreviousId: string,
  ) {
    let cursor: string | null = firstPreviousId;
    const visited = new Set<string>();
    for (let depth = 0; cursor && depth < 50; depth += 1) {
      if (cursor === targetEventId || visited.has(cursor))
        throw calendarInvalidInput('Řetězec cest nesmí obsahovat cyklus.');
      visited.add(cursor);
      cursor =
        (await this.plans.find(householdId, cursor, travelerUserId))
          ?.previousEventId ?? null;
    }
    if (cursor)
      throw calendarInvalidInput(
        'Řetězec cest je příliš dlouhý nebo obsahuje cyklus.',
      );
  }
}
