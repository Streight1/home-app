import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { locationInvalidInput } from '../../domain/location.errors.js';
import {
  CALENDAR_PREFERENCE_REPOSITORY,
  type CalendarPreferenceRepository,
} from '../../domain/ports/calendar-preference.repository.js';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from '../../domain/ports/saved-place.repository.js';
import type { UpdateCalendarPreferencesDto } from '../../presentation/dto/update-calendar-preferences.dto.js';

@Injectable()
export class CalendarPreferencesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    @Inject(CALENDAR_PREFERENCE_REPOSITORY)
    private readonly preferences: CalendarPreferenceRepository,
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
  ) {}
  public async get(userId: string) {
    const membership = await this.access.getActiveMembership(userId);
    return this.preferences.getOrCreate(membership.householdId, userId);
  }
  public async update(userId: string, input: UpdateCalendarPreferencesDto) {
    const membership = await this.access.getActiveMembership(userId);
    if (input.defaultPlaceId) {
      const place = await this.places.findVisible(
        membership.householdId,
        userId,
        input.defaultPlaceId,
      );
      if (!place) throw locationInvalidInput('Výchozí místo není dostupné.');
    }
    if (input.lastWorkShiftParticipantUserId)
      await this.access.assertActiveMembers(membership.householdId, [
        input.lastWorkShiftParticipantUserId,
      ]);
    return this.preferences.update({
      householdId: membership.householdId,
      userId,
      patch: input,
    });
  }

  public async rememberLastWorkShiftParticipant(
    userId: string,
    participantUserId: string,
  ) {
    return this.update(userId, {
      lastWorkShiftParticipantUserId: participantUserId,
    });
  }
}
