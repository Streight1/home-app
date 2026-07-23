import { Inject, Injectable } from '@nestjs/common';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from '../../../location/domain/ports/saved-place.repository.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';

@Injectable()
export class EventLocationValidationService {
  public constructor(
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
  ) {}
  public async assertVisible(
    userId: string,
    householdId: string,
    placeId: string | null | undefined,
  ) {
    if (!placeId) return;
    if (!(await this.places.findVisible(householdId, userId, placeId)))
      throw calendarInvalidInput('Vybrané místo není dostupné.');
  }
}
