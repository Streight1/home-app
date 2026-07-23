import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../../config/app-config.service.js';
import { ResolvePlaceCoordinatesService } from '../../../location/application/places/resolve-place-coordinates.service.js';
import { CalculateRouteEstimateService } from '../../../location/application/routing/calculate-route-estimate.service.js';
import { CalendarPreferencesService } from '../../../location/application/preferences/calendar-preferences.service.js';
import {
  SAVED_PLACE_REPOSITORY,
  type SavedPlaceRepository,
} from '../../../location/domain/ports/saved-place.repository.js';
import { HouseholdAccessService } from '../../../households/household-access.service.js';
import {
  calendarInvalidInput,
  calendarNotFound,
} from '../../domain/calendar.errors.js';
import {
  CALENDAR_EVENT_REPOSITORY,
  type CalendarEventRepository,
} from '../../domain/ports/calendar-event.repository.js';
import {
  CALENDAR_TRAVEL_PLAN_REPOSITORY,
  type CalendarEventTravelPlanRepository,
} from '../../domain/travel/calendar-event-travel-plan.repository.js';
import type { CalendarEventTravelPlanRecord } from '../../domain/travel/travel-plan.types.js';
import type { UpsertTravelPlanDto } from '../../presentation/dto/upsert-travel-plan.dto.js';
import { ResolveTravelOriginService } from './resolve-travel-origin.service.js';
import { mapTravelPlanResponse } from './travel-plan-response.mapper.js';

@Injectable()
export class CalendarTravelPlanService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly config: AppConfigService,
    private readonly route: CalculateRouteEstimateService,
    private readonly coordinates: ResolvePlaceCoordinatesService,
    private readonly preferences: CalendarPreferencesService,
    private readonly origin: ResolveTravelOriginService,
    @Inject(SAVED_PLACE_REPOSITORY)
    private readonly places: SavedPlaceRepository,
    @Inject(CALENDAR_EVENT_REPOSITORY)
    private readonly events: CalendarEventRepository,
    @Inject(CALENDAR_TRAVEL_PLAN_REPOSITORY)
    private readonly plans: CalendarEventTravelPlanRepository,
  ) {}

  public async list(userId: string, eventId: string) {
    const membership = await this.access.getActiveMembership(userId);
    const event = await this.events.findById(membership.householdId, eventId);
    if (!event) throw calendarNotFound();
    const plans = await this.plans.listForEvent(
      membership.householdId,
      eventId,
    );
    return {
      items: await Promise.all(
        plans.map((plan) =>
          this.calculate(userId, membership.householdId, event, plan),
        ),
      ),
    };
  }

  public async configure(
    userId: string,
    eventId: string,
    travelerUserId: string,
    input: UpsertTravelPlanDto,
  ) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    if (input.travelerUserId !== travelerUserId)
      throw calendarInvalidInput(
        'Cestující v adrese a těle požadavku se musí shodovat.',
      );
    await this.access.assertActiveMembers(membership.householdId, [
      travelerUserId,
    ]);
    const event = await this.events.findById(membership.householdId, eventId);
    if (!event) throw calendarNotFound();
    if (!event.participants.some(({ user }) => user.id === travelerUserId))
      throw calendarInvalidInput(
        'Cestu lze plánovat jen pro účastníka události.',
      );
    if (!event.locationPlaceId)
      throw calendarInvalidInput('Cílové místo není vhodné pro routing.');
    const plan = await this.plans.upsertConfiguration({
      householdId: membership.householdId,
      eventId,
      travelerUserId,
      userId,
      originMode: input.originMode,
      originPlaceId: input.originPlaceId ?? null,
      previousEventId: input.previousEventId ?? null,
      destinationPlaceId: event.locationPlaceId,
      routeMode: input.routeMode,
      avoidTolls: input.avoidTolls,
      avoidHighways: input.avoidHighways,
      travelBufferMinutes: input.travelBufferMinutes,
    });
    return this.calculate(userId, membership.householdId, event, plan);
  }

  public async configureAutoForEvent(
    userId: string,
    event: NonNullable<
      Awaited<ReturnType<CalendarEventRepository['findById']>>
    >,
    templateDefaults?: {
      routeMode: UpsertTravelPlanDto['routeMode'];
      travelBufferMinutes: number;
    },
  ) {
    return Promise.all(
      event.participants.map(async ({ user }) => {
        const preference = await this.preferences.get(user.id);
        return this.configure(userId, event.id, user.id, {
          travelerUserId: user.id,
          originMode: 'AUTO',
          routeMode: templateDefaults?.routeMode ?? preference.defaultRouteMode,
          avoidTolls: preference.avoidTolls,
          avoidHighways: preference.avoidHighways,
          travelBufferMinutes:
            templateDefaults?.travelBufferMinutes ??
            preference.defaultTravelBufferMinutes,
          allowTravelConflict: false,
        });
      }),
    );
  }

  public async recalculate(
    userId: string,
    eventId: string,
    travelerUserId: string,
  ) {
    const membership = await this.access.getActiveMembership(userId, 'MEMBER');
    const event = await this.events.findById(membership.householdId, eventId);
    if (!event) throw calendarNotFound();
    const plan = await this.plans.find(
      membership.householdId,
      eventId,
      travelerUserId,
    );
    if (!plan) throw calendarInvalidInput('Nejprve nastavte způsob cesty.');
    return this.calculate(userId, membership.householdId, event, plan);
  }

  public async staleAfterEventChange(householdId: string, eventId: string) {
    await Promise.all([
      this.plans.markEventPlansStale(householdId, eventId),
      this.plans.markDependentPlansStale(householdId, eventId),
    ]);
  }

  private async calculate(
    userId: string,
    householdId: string,
    event: NonNullable<
      Awaited<ReturnType<CalendarEventRepository['findById']>>
    >,
    plan: CalendarEventTravelPlanRecord,
  ) {
    try {
      const origin = await this.origin.execute({
        userId,
        householdId,
        travelerUserId: plan.travelerUserId,
        target: event,
        originMode: plan.originMode,
        originPlaceId: plan.originPlaceId,
        previousEventId: plan.previousEventId,
      });
      const destination = await this.places.findInHousehold(
        householdId,
        plan.destinationPlaceId,
      );
      if (!destination) throw calendarInvalidInput('Cíl není dostupný.');
      const [start, end] = await Promise.all([
        this.coordinates.execute(origin.place),
        this.coordinates.execute(destination),
      ]);
      const estimate = await this.route.execute({
        start,
        end,
        routeMode: plan.routeMode,
        avoidTolls: plan.avoidTolls,
        avoidHighways: plan.avoidHighways,
        departureAt: event.startsAt,
      });
      const departureAt = new Date(
        event.startsAt.getTime() -
          estimate.durationSeconds * 1000 -
          plan.travelBufferMinutes * 60_000,
      );
      return mapTravelPlanResponse(plan, origin.previousEvent, {
        distanceMeters: estimate.distanceMeters,
        durationSeconds: estimate.durationSeconds,
        departureAt,
        originSource: origin.source,
        originEventTitle: origin.previousEvent?.title ?? null,
      });
    } catch {
      return {
        ...mapTravelPlanResponse(plan, null),
        status: this.config.mapyApiEnabled ? 'FAILED' : 'UNAVAILABLE',
      };
    }
  }
}
