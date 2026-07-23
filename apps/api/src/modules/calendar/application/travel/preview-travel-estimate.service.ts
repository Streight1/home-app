import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { ResolvePlaceCoordinatesService } from '../../../location/application/places/resolve-place-coordinates.service.js';
import { CalculateRouteEstimateService } from '../../../location/application/routing/calculate-route-estimate.service.js';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from '../../../location/domain/ports/saved-place.repository.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import { calendarInvalidInput } from '../../domain/calendar.errors.js';
import type { CalendarParticipantSummary } from '../../domain/calendar.types.js';
import type { TravelEstimateDto } from '../../presentation/dto/travel-estimate.dto.js';
import { ResolveTravelOriginService } from './resolve-travel-origin.service.js';

@Injectable()
export class PreviewTravelEstimateService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly config: AppConfigService,
    private readonly origins: ResolveTravelOriginService,
    private readonly coordinates: ResolvePlaceCoordinatesService,
    private readonly routes: CalculateRouteEstimateService,
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
  ) {}

  public async execute(userId: string, input: TravelEstimateDto) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    await this.access.assertActiveMembers(
      membership.householdId,
      input.participantIds,
    );
    const destination = await this.places.findVisible(
      membership.householdId,
      userId,
      input.destinationPlaceId,
    );
    if (!destination) throw calendarInvalidInput('Cílové místo není dostupné.');
    const startsAt = new Date(input.startsAt);
    if (!Number.isFinite(startsAt.getTime()))
      throw calendarInvalidInput('Začátek události není platný.');
    const participants: CalendarParticipantSummary[] = input.participantIds.map(
      (id) => ({
        role: 'ATTENDEE',
        user: {
          id,
          email: '',
          displayName: null,
          avatarUrl: null,
          calendarColorToken: 'violet',
        },
      }),
    );
    const target = {
      id: input.eventId ?? '00000000-0000-4000-8000-000000000000',
      startsAt,
      participants,
    };
    const items = await Promise.all(
      input.participantIds.map((travelerUserId) =>
        this.forParticipant(
          userId,
          membership.householdId,
          travelerUserId,
          target,
          destination,
          input,
        ),
      ),
    );
    return { items, provider: 'MAPY', persisted: false };
  }

  private async forParticipant(
    userId: string,
    householdId: string,
    travelerUserId: string,
    target: Parameters<ResolveTravelOriginService['execute']>[0]['target'],
    destination: NonNullable<
      Awaited<ReturnType<SavedPlaceRepository['findVisible']>>
    >,
    input: TravelEstimateDto,
  ) {
    try {
      const origin = await this.origins.execute({
        userId,
        householdId,
        travelerUserId,
        target,
        originMode: input.originMode,
        originPlaceId: input.originPlaceId ?? null,
        previousEventId: input.previousEventId ?? null,
      });
      const [start, end] = await Promise.all([
        this.coordinates.execute(origin.place),
        this.coordinates.execute(destination),
      ]);
      const route = await this.routes.execute({
        start,
        end,
        routeMode: input.routeMode,
        avoidTolls: input.avoidTolls,
        avoidHighways: input.avoidHighways,
        departureAt: target.startsAt,
      });
      const requiredSeconds =
        route.durationSeconds + input.travelBufferMinutes * 60;
      const departureAt = new Date(
        target.startsAt.getTime() - requiredSeconds * 1000,
      );
      const availableSeconds = origin.previousEvent
        ? Math.max(
            0,
            Math.floor(
              (target.startsAt.getTime() -
                origin.previousEvent.endsAt.getTime()) /
                1000,
            ),
          )
        : null;
      const missingSeconds =
        availableSeconds === null
          ? 0
          : Math.max(0, requiredSeconds - availableSeconds);
      return {
        travelerUserId,
        status: 'READY' as const,
        durationSeconds: route.durationSeconds,
        distanceMeters: route.distanceMeters,
        departureAt: departureAt.toISOString(),
        origin: {
          source: origin.source,
          eventTitle: origin.previousEvent?.title ?? null,
        },
        conflict: { hasConflict: missingSeconds > 0, missingSeconds },
      };
    } catch {
      return {
        travelerUserId,
        status: this.config.mapyApiEnabled
          ? ('FAILED' as const)
          : ('UNAVAILABLE' as const),
        durationSeconds: null,
        distanceMeters: null,
        departureAt: null,
        origin: null,
        conflict: { hasConflict: false, missingSeconds: 0 },
      };
    }
  }
}
