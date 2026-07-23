import { describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../src/config/app-config.service.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { CalendarTravelPlanService } from '../src/modules/calendar/application/travel/calendar-travel-plan.service.js';
import { ResolveTravelOriginService } from '../src/modules/calendar/application/travel/resolve-travel-origin.service.js';
import type { CalendarEventRecord } from '../src/modules/calendar/domain/calendar.types.js';
import type { CalendarEventRepository } from '../src/modules/calendar/domain/ports/calendar-event.repository.js';
import type { CalendarEventTravelPlanRepository } from '../src/modules/calendar/domain/travel/calendar-event-travel-plan.repository.js';
import type { CalendarEventTravelPlanRecord } from '../src/modules/calendar/domain/travel/travel-plan.types.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import { SuggestPlacesService } from '../src/modules/location/application/places/suggest-places.service.js';
import { CalendarPreferencesService } from '../src/modules/location/application/preferences/calendar-preferences.service.js';
import type { ResolvePlaceCoordinatesService } from '../src/modules/location/application/places/resolve-place-coordinates.service.js';
import { CalculateRouteEstimateService } from '../src/modules/location/application/routing/calculate-route-estimate.service.js';
import type {
  CalendarPreferenceRecord,
  SavedPlaceRecord,
} from '../src/modules/location/domain/location.types.js';
import type { GeocodingProviderPort } from '../src/modules/location/domain/ports/geocoding-provider.port.js';
import type { RoutingProviderPort } from '../src/modules/location/domain/ports/routing-provider.port.js';
import type { SavedPlaceRepository } from '../src/modules/location/domain/ports/saved-place.repository.js';
import { PrismaSavedPlaceRepository } from '../src/modules/location/infrastructure/prisma-saved-place.repository.js';
import { MapyApiClient } from '../src/modules/location/infrastructure/providers/mapy/mapy-api.client.js';
import {
  mapMapyRoute,
  mapMapySuggestions,
} from '../src/modules/location/infrastructure/providers/mapy/mapy-response.mapper.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const travelerUserId = '30000000-0000-4000-8000-000000000003';
const eventId = '40000000-0000-4000-8000-000000000004';
const previousEventId = '50000000-0000-4000-8000-000000000005';
const originPlaceId = '60000000-0000-4000-8000-000000000006';
const destinationPlaceId = '70000000-0000-4000-8000-000000000007';

const config = (patch: Partial<AppConfigService> = {}) =>
  ({
    mapyApiEnabled: true,
    mapyApiKey: 'test-key-never-logged',
    mapyApiTimeoutMs: 5_000,
    mapySuggestMinQueryLength: 3,
    mapySuggestMaxResults: 8,
    mapyDefaultLanguage: 'cs',
    ...patch,
  }) as unknown as AppConfigService;

const access = () =>
  ({
    getActiveMembership: vi.fn().mockResolvedValue({
      householdId,
      role: 'MEMBER',
    }),
    assertActiveMembers: vi.fn().mockResolvedValue(undefined),
  }) as unknown as HouseholdAccessService;

function place(
  id: string,
  patch: Partial<SavedPlaceRecord> = {},
): SavedPlaceRecord {
  return {
    id,
    householdId,
    ownerUserId: userId,
    visibility: 'PRIVATE',
    label: 'Místo',
    formattedAddress: 'Veřejná testovací adresa',
    provider: 'MAPY',
    placeType: 'regional.address',
    ...patch,
  };
}

function event(
  id = eventId,
  patch: Partial<CalendarEventRecord> = {},
): CalendarEventRecord {
  return {
    id,
    householdId,
    title: 'Kontrola',
    description: null,
    type: 'GENERAL',
    status: 'ACTIVE',
    startsAt: new Date('2026-07-16T10:00:00.000Z'),
    endsAt: new Date('2026-07-16T11:00:00.000Z'),
    timezone: 'Europe/Prague',
    isAllDay: false,
    location: null,
    locationPlaceId: destinationPlaceId,
    locationLabel: 'Cíl',
    locationNotes: null,
    calculateTravel: true,
    colorToken: 'primary',
    source: 'MANUAL',
    templateId: null,
    templateApplicationBatchId: null,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    participants: [
      {
        role: 'ATTENDEE',
        user: {
          id: travelerUserId,
          email: 'cestujici@example.test',
          displayName: 'Cestující',
          avatarUrl: null,
          calendarColorToken: 'cyan',
        },
      },
    ],
    taskLink: null,
    ...patch,
  };
}

const preference = (
  patch: Partial<CalendarPreferenceRecord> = {},
): CalendarPreferenceRecord => ({
  householdId,
  userId: travelerUserId,
  defaultPlaceId: originPlaceId,
  defaultRouteMode: 'CAR_FAST_TRAFFIC',
  defaultTravelBufferMinutes: 10,
  avoidTolls: false,
  avoidHighways: false,
  compactCalendarView: 'AGENDA',
  mediumCalendarView: 'MONTH',
  expandedCalendarView: 'WEEK',
  showTravelBlocks: true,
  lastWorkShiftParticipantUserId: null,
  ...patch,
});

function plan(
  patch: Partial<CalendarEventTravelPlanRecord> = {},
): CalendarEventTravelPlanRecord {
  return {
    id: '80000000-0000-4000-8000-000000000008',
    householdId,
    eventId,
    travelerUserId,
    originMode: 'DEFAULT_PLACE',
    originPlaceId: null,
    previousEventId: null,
    destinationPlaceId,
    routeMode: 'CAR_FAST_TRAFFIC',
    avoidTolls: false,
    avoidHighways: false,
    travelBufferMinutes: 10,
    status: 'STALE',
    ...patch,
  };
}

describe('location provider boundary', () => {
  it('rejects a short suggest query without calling the provider', async () => {
    const provider = { suggest: vi.fn() } as unknown as GeocodingProviderPort;
    const service = new SuggestPlacesService(access(), config(), provider);
    await expect(service.execute(userId, 'ab', ['poi'])).rejects.toMatchObject({
      code: 'LOCATION_INVALID_INPUT',
    });
    expect(provider.suggest).not.toHaveBeenCalled();
  });

  it('normalizes a query and passes only supported result types', async () => {
    const provider = {
      suggest: vi.fn().mockResolvedValue([]),
    } as unknown as GeocodingProviderPort;
    await new SuggestPlacesService(access(), config(), provider).execute(
      userId,
      '  Praha   lékárna ',
      ['poi', 'unsafe'],
    );
    expect(provider.suggest).toHaveBeenCalledWith({
      query: 'Praha lékárna',
      language: 'cs',
      limit: 8,
      types: ['poi'],
    });
  });

  it('reports a disabled provider separately from an empty result', async () => {
    const provider = { suggest: vi.fn() } as unknown as GeocodingProviderPort;
    await expect(
      new SuggestPlacesService(
        access(),
        config({ mapyApiEnabled: false }),
        provider,
      ).execute(userId, 'Praha', ['poi']),
    ).rejects.toMatchObject({ code: 'LOCATION_PROVIDER_NOT_CONFIGURED' });
    expect(provider.suggest).not.toHaveBeenCalled();
  });

  it('maps a provider authorization failure to a safe code', async () => {
    const provider = {
      suggest: vi.fn().mockRejectedValue({ code: 'FORBIDDEN' }),
    } as unknown as GeocodingProviderPort;
    await expect(
      new SuggestPlacesService(access(), config(), provider).execute(
        userId,
        'Praha',
        ['poi'],
      ),
    ).rejects.toMatchObject({ code: 'LOCATION_PROVIDER_FORBIDDEN' });
  });

  it('does not cache provider suggestion results', async () => {
    const provider = {
      suggest: vi.fn().mockResolvedValue([]),
    } as unknown as GeocodingProviderPort;
    const service = new SuggestPlacesService(access(), config(), provider);
    await service.execute(userId, 'Praha', ['poi']);
    await service.execute(userId, 'praha', ['poi']);
    expect(provider.suggest).toHaveBeenCalledTimes(2);
  });

  it('maps only safe Mapy suggestion fields', () => {
    const result = mapMapySuggestions({
      secret: 'must-not-leak',
      items: [
        {
          name: 'Lékárna',
          location: 'Praha',
          label: 'ignored',
          type: 'poi',
          position: { lat: 50.1, lon: 14.4 },
          rawProviderField: 'must-not-leak',
        },
      ],
    });
    expect(result[0]).toEqual({
      providerPlaceId: null,
      primaryLabel: 'Lékárna',
      secondaryLabel: 'Praha',
      formattedAddress: 'Lékárna, Praha',
      latitude: 50.1,
      longitude: 14.4,
      placeType: 'poi',
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
  });

  it('rejects a malformed provider payload', () => {
    expect(() =>
      mapMapySuggestions({ items: [{ name: 'Bez pozice' }] }),
    ).toThrow(expect.objectContaining({ code: 'UPSTREAM' }));
  });

  it('maps a safe route estimate', () => {
    expect(mapMapyRoute({ length: 12_345, duration: 1_800 })).toMatchObject({
      distanceMeters: 12_345,
      durationSeconds: 1_800,
      providerCalculatedAt: expect.any(Date),
    });
  });

  it('turns a provider timeout into a safe typed error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError')),
    );
    const client = new MapyApiClient(config());
    await expect(
      client.get('/v1/suggest', new URLSearchParams()),
    ).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('does not expose a private place through another user list query', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new PrismaSavedPlaceRepository({
      savedPlace: { findMany },
    } as unknown as PrismaService);
    await repository.listVisible(householdId, 'other-user');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          householdId,
          OR: [{ visibility: 'HOUSEHOLD' }, { ownerUserId: 'other-user' }],
        }),
      }),
    );
  });
});

describe('calendar origins and preferences', () => {
  function originService(
    options: {
      preferences?: Partial<CalendarPreferenceRecord>;
      findPlace?: ReturnType<typeof vi.fn>;
      findEvent?: ReturnType<typeof vi.fn>;
      listEvents?: ReturnType<typeof vi.fn>;
      findPlan?: ReturnType<typeof vi.fn>;
    } = {},
  ) {
    const preferences = {
      get: vi.fn().mockResolvedValue(preference(options.preferences)),
    } as unknown as CalendarPreferencesService;
    const places = {
      findVisible:
        options.findPlace ??
        vi
          .fn()
          .mockImplementation(
            (_householdId: string, _userId: string, id: string) =>
              Promise.resolve(place(id)),
          ),
      findForOwner:
        options.findPlace ??
        vi
          .fn()
          .mockImplementation(
            (_householdId: string, _ownerUserId: string, id: string) =>
              Promise.resolve(place(id)),
          ),
      findInHousehold: vi
        .fn()
        .mockImplementation((_householdId: string, id: string) =>
          Promise.resolve(place(id)),
        ),
    } as unknown as SavedPlaceRepository;
    const events = {
      findById: options.findEvent ?? vi.fn().mockResolvedValue(null),
      list: options.listEvents ?? vi.fn().mockResolvedValue([]),
    } as unknown as CalendarEventRepository;
    const plans = {
      find: options.findPlan ?? vi.fn().mockResolvedValue(null),
    } as unknown as CalendarEventTravelPlanRepository;
    return new ResolveTravelOriginService(preferences, places, events, plans);
  }

  it('uses the traveler default place for DEFAULT_PLACE', async () => {
    const result = await originService().execute({
      userId,
      householdId,
      travelerUserId,
      target: event(),
      originMode: 'DEFAULT_PLACE',
      originPlaceId: null,
      previousEventId: null,
    });
    expect(result.place.id).toBe(originPlaceId);
  });

  it('AUTO prefers the nearest prior event of the same participant', async () => {
    const prior = event(previousEventId, {
      endsAt: new Date('2026-07-16T09:30:00.000Z'),
      locationPlaceId: originPlaceId,
    });
    const result = await originService({
      listEvents: vi.fn().mockResolvedValue([prior]),
    }).execute({
      userId,
      householdId,
      travelerUserId,
      target: event(),
      originMode: 'AUTO',
      originPlaceId: null,
      previousEventId: null,
    });
    expect(result.source).toBe('PREVIOUS_EVENT');
    expect(result.previousEvent?.id).toBe(previousEventId);
  });

  it('AUTO ignores another participant event and falls back to the traveler default', async () => {
    const otherParticipant = event(previousEventId, {
      endsAt: new Date('2026-07-16T09:30:00.000Z'),
      participants: [],
      locationPlaceId: originPlaceId,
    });
    const result = await originService({
      listEvents: vi.fn().mockResolvedValue([otherParticipant]),
    }).execute({
      userId,
      householdId,
      travelerUserId,
      target: event(),
      originMode: 'AUTO',
      originPlaceId: null,
      previousEventId: null,
    });
    expect(result.source).toBe('DEFAULT_PLACE');
    expect(result.previousEvent).toBeNull();
  });

  it('requires a configured default place', async () => {
    await expect(
      originService({ preferences: { defaultPlaceId: null } }).execute({
        userId,
        householdId,
        travelerUserId,
        target: event(),
        originMode: 'DEFAULT_PLACE',
        originPlaceId: null,
        previousEventId: null,
      }),
    ).rejects.toMatchObject({ code: 'CALENDAR_INVALID_INPUT' });
  });

  it('gives an explicitly selected custom place priority', async () => {
    const result = await originService().execute({
      userId,
      householdId,
      travelerUserId,
      target: event(),
      originMode: 'CUSTOM_PLACE',
      originPlaceId: '90000000-0000-4000-8000-000000000009',
      previousEventId,
    });
    expect(result.place.id).toBe('90000000-0000-4000-8000-000000000009');
    expect(result.previousEvent).toBeNull();
  });

  it('uses the structured destination of an explicit previous event', async () => {
    const previous = event(previousEventId, {
      endsAt: new Date('2026-07-16T09:30:00.000Z'),
      locationPlaceId: originPlaceId,
    });
    const result = await originService({
      findEvent: vi.fn().mockResolvedValue(previous),
    }).execute({
      userId,
      householdId,
      travelerUserId,
      target: event(),
      originMode: 'PREVIOUS_EVENT',
      originPlaceId: null,
      previousEventId,
    });
    expect(result.previousEvent?.id).toBe(previousEventId);
    expect(result.place.id).toBe(originPlaceId);
  });

  it('rejects a previous event outside the current household scope', async () => {
    await expect(
      originService({ findEvent: vi.fn().mockResolvedValue(null) }).execute({
        userId,
        householdId,
        travelerUserId,
        target: event(),
        originMode: 'PREVIOUS_EVENT',
        originPlaceId: null,
        previousEventId,
      }),
    ).rejects.toMatchObject({ code: 'CALENDAR_INVALID_INPUT' });
  });

  it('rejects linking an event to itself', async () => {
    await expect(
      originService().execute({
        userId,
        householdId,
        travelerUserId,
        target: event(),
        originMode: 'PREVIOUS_EVENT',
        originPlaceId: null,
        previousEventId: eventId,
      }),
    ).rejects.toMatchObject({ code: 'CALENDAR_INVALID_INPUT' });
  });

  it('rejects a previous event ending after the target starts', async () => {
    await expect(
      originService({
        findEvent: vi.fn().mockResolvedValue(
          event(previousEventId, {
            endsAt: new Date('2026-07-16T10:01:00.000Z'),
          }),
        ),
      }).execute({
        userId,
        householdId,
        travelerUserId,
        target: event(),
        originMode: 'PREVIOUS_EVENT',
        originPlaceId: null,
        previousEventId,
      }),
    ).rejects.toMatchObject({ code: 'CALENDAR_INVALID_INPUT' });
  });

  it('rejects a cycle in the explicit previous-event chain', async () => {
    const previous = event(previousEventId, {
      endsAt: new Date('2026-07-16T09:30:00.000Z'),
      locationPlaceId: originPlaceId,
    });
    await expect(
      originService({
        findEvent: vi.fn().mockResolvedValue(previous),
        findPlan: vi.fn().mockResolvedValue({ previousEventId: eventId }),
      }).execute({
        userId,
        householdId,
        travelerUserId,
        target: event(),
        originMode: 'PREVIOUS_EVENT',
        originPlaceId: null,
        previousEventId,
      }),
    ).rejects.toMatchObject({ code: 'CALENDAR_INVALID_INPUT' });
  });

  it('keeps compact and expanded view preferences separate', async () => {
    const update = vi
      .fn()
      .mockImplementation(({ patch }) =>
        Promise.resolve(preference(patch as Partial<CalendarPreferenceRecord>)),
      );
    const service = new CalendarPreferencesService(
      access(),
      { update } as never,
      { findVisible: vi.fn() } as never,
    );
    await service.update(userId, {
      compactCalendarView: 'AGENDA',
      expandedCalendarView: 'WEEK',
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        patch: expect.objectContaining({
          compactCalendarView: 'AGENDA',
          expandedCalendarView: 'WEEK',
        }),
      }),
    );
  });
});

describe('route estimate and travel plan', () => {
  const routeInput = {
    start: { latitude: 50, longitude: 14 },
    end: { latitude: 49, longitude: 15 },
    routeMode: 'CAR_FAST_TRAFFIC' as const,
    avoidTolls: false,
    avoidHighways: false,
    departureAt: new Date('2026-07-16T10:00:00.000Z'),
  };

  it('does not cache routing responses', async () => {
    const calculate = vi.fn().mockResolvedValue({
      distanceMeters: 12_000,
      durationSeconds: 1_800,
      providerCalculatedAt: new Date('2026-07-16T08:00:00.000Z'),
    });
    const service = new CalculateRouteEstimateService(config(), {
      calculate,
    } as unknown as RoutingProviderPort);
    await service.execute(routeInput);
    await service.execute(routeInput);
    expect(calculate).toHaveBeenCalledTimes(2);
  });

  function travelService(
    options: {
      routeFailure?: boolean;
      previous?: CalendarEventRecord | null;
      durationSeconds?: number;
      bufferMinutes?: number;
    } = {},
  ) {
    const target = event();
    const current = plan({ travelBufferMinutes: options.bufferMinutes ?? 10 });
    const plans = {
      upsertConfiguration: vi.fn().mockResolvedValue(current),
      find: vi.fn().mockImplementation(() => Promise.resolve(current)),
      listForEvent: vi.fn().mockResolvedValue([current]),
      markEventPlansStale: vi.fn().mockResolvedValue(undefined),
      markDependentPlansStale: vi.fn().mockResolvedValue(undefined),
    } as unknown as CalendarEventTravelPlanRepository;
    const route = {
      execute: options.routeFailure
        ? vi.fn().mockRejectedValue(new Error('provider failed'))
        : vi.fn().mockResolvedValue({
            distanceMeters: 18_000,
            durationSeconds: options.durationSeconds ?? 1_800,
            providerCalculatedAt: new Date('2026-07-16T08:00:00.000Z'),
          }),
    } as unknown as CalculateRouteEstimateService;
    const origin = {
      execute: vi.fn().mockResolvedValue({
        place: place(originPlaceId),
        previousEvent: options.previous ?? null,
        source: options.previous ? 'PREVIOUS_EVENT' : 'DEFAULT_PLACE',
      }),
    } as unknown as ResolveTravelOriginService;
    const service = new CalendarTravelPlanService(
      access(),
      config(),
      route,
      {
        execute: vi
          .fn()
          .mockImplementation((savedPlace: SavedPlaceRecord) =>
            Promise.resolve(
              savedPlace.id === originPlaceId
                ? { latitude: 50, longitude: 14 }
                : { latitude: 49, longitude: 15 },
            ),
          ),
      } as unknown as ResolvePlaceCoordinatesService,
      {
        get: vi.fn().mockResolvedValue(preference()),
      } as unknown as CalendarPreferencesService,
      origin,
      {
        findInHousehold: vi
          .fn()
          .mockImplementation((_household: string, id: string) =>
            Promise.resolve(place(id)),
          ),
      } as unknown as SavedPlaceRepository,
      {
        findById: vi.fn().mockResolvedValue(target),
      } as unknown as CalendarEventRepository,
      plans,
    );
    return { service, plans, target };
  }

  const travelInput = {
    travelerUserId,
    originMode: 'DEFAULT_PLACE' as const,
    routeMode: 'CAR_FAST_TRAFFIC' as const,
    avoidTolls: false,
    avoidHighways: false,
    travelBufferMinutes: 10,
    allowTravelConflict: false,
  };

  it('calculates departureAt from event start, duration and buffer', async () => {
    const { service } = travelService({
      durationSeconds: 1_800,
      bufferMinutes: 10,
    });
    const result = await service.configure(
      userId,
      eventId,
      travelerUserId,
      travelInput,
    );
    expect(result.departureAt).toBe('2026-07-16T09:20:00.000Z');
  });

  it('rejects a traveler mismatch between the route and request body', async () => {
    const { service, plans } = travelService();
    await expect(
      service.configure(userId, eventId, travelerUserId, {
        ...travelInput,
        travelerUserId: '40000000-0000-4000-8000-000000000004',
      }),
    ).rejects.toMatchObject({ response: { code: 'CALENDAR_INVALID_INPUT' } });
    expect(plans.upsertConfiguration).not.toHaveBeenCalled();
  });

  it('includes a larger safety buffer in departureAt', async () => {
    const { service } = travelService({
      durationSeconds: 1_800,
      bufferMinutes: 20,
    });
    const result = await service.configure(userId, eventId, travelerUserId, {
      ...travelInput,
      travelBufferMinutes: 20,
    });
    expect(result.departureAt).toBe('2026-07-16T09:10:00.000Z');
  });

  it('does not alter the event start or end while calculating travel', async () => {
    const { service, target } = travelService();
    const before = {
      start: target.startsAt.toISOString(),
      end: target.endsAt.toISOString(),
    };
    await service.configure(userId, eventId, travelerUserId, travelInput);
    expect({
      start: target.startsAt.toISOString(),
      end: target.endsAt.toISOString(),
    }).toEqual(before);
  });

  it('keeps the plan and marks it failed when the provider fails', async () => {
    const { service } = travelService({ routeFailure: true });
    const result = await service.configure(
      userId,
      eventId,
      travelerUserId,
      travelInput,
    );
    expect(result.status).toBe('FAILED');
  });

  it('returns a textual conflict calculation for insufficient transfer time', async () => {
    const previous = event(previousEventId, {
      endsAt: new Date('2026-07-16T09:45:00.000Z'),
    });
    const { service } = travelService({
      durationSeconds: 1_800,
      bufferMinutes: 10,
      previous,
    });
    const result = await service.configure(
      userId,
      eventId,
      travelerUserId,
      travelInput,
    );
    expect(result.conflict).toEqual({
      hasConflict: true,
      availableTransferSeconds: 900,
      requiredTransferSeconds: 2_400,
      missingSeconds: 1_500,
    });
  });

  it('marks both direct and dependent plans stale after an event change', async () => {
    const { service, plans } = travelService();
    await service.staleAfterEventChange(householdId, eventId);
    expect(plans.markEventPlansStale).toHaveBeenCalledWith(
      householdId,
      eventId,
    );
    expect(plans.markDependentPlansStale).toHaveBeenCalledWith(
      householdId,
      eventId,
    );
  });
});
