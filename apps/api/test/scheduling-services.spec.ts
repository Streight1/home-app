import { describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../src/config/app-config.service.js';
import type { CalendarAvailabilityFacade } from '../src/modules/calendar/calendar-availability.facade.js';
import type { CalendarEventCreationFacade } from '../src/modules/calendar/calendar-event-creation.facade.js';
import type { TravelEstimationFacade } from '../src/modules/location/travel-estimation.facade.js';
import { CandidateTokenService } from '../src/modules/scheduling/application/candidate-token.service.js';
import { ConfirmTaskSlotService } from '../src/modules/scheduling/application/confirm-task-slot.service.js';
import { SchedulingCandidateEvaluatorService } from '../src/modules/scheduling/application/scheduling-candidate-evaluator.service.js';
import { SuggestTaskSlotsService } from '../src/modules/scheduling/application/suggest-task-slots.service.js';
import type { TaskCalendarLinkRepository } from '../src/modules/scheduling/domain/ports/task-calendar-link.repository.js';
import { SuggestTaskSlotsDto } from '../src/modules/scheduling/presentation/dto/suggest-task-slots.dto.js';
import type { TasksFacade } from '../src/modules/tasks/tasks.facade.js';

const userId = '10000000-0000-4000-8000-000000000001';
const secondUserId = '10000000-0000-4000-8000-000000000002';
const householdId = '20000000-0000-4000-8000-000000000001';
const taskId = '30000000-0000-4000-8000-000000000001';
const destinationId = '40000000-0000-4000-8000-000000000001';

const summary = (patch: Record<string, unknown> = {}) => ({
  id: taskId,
  householdId,
  title: 'Společný nákup',
  estimatedDurationMinutes: 60,
  participants: [
    { userId, displayName: 'Adam', avatarUrl: null },
    { userId: secondUserId, displayName: 'Jana', avatarUrl: null },
  ],
  location: { placeId: destinationId, label: 'Obchod', routable: true },
  version: 'task-v1',
  ...patch,
});

const request = (patch: Partial<SuggestTaskSlotsDto> = {}) =>
  Object.assign(new SuggestTaskSlotsDto(), {
    date: '2026-07-20',
    earliestTime: '06:00',
    latestTime: '22:00',
    timezone: 'UTC',
    routeMode: 'CAR_FAST_TRAFFIC' as const,
    travelBufferMinutes: 10,
    suggestionCount: 3,
    ...patch,
  });

const event = (
  id: string,
  startsAt: string,
  endsAt: string,
  locationPlaceId: string | null,
) => ({
  id,
  title: id,
  startsAt: new Date(startsAt),
  endsAt: new Date(endsAt),
  locationPlaceId,
  updatedAt: new Date('2026-07-19T10:00:00.000Z'),
});

function harness(input?: {
  task?: ReturnType<typeof summary>;
  availability?: {
    participants: {
      userId: string;
      defaultPlaceId: string | null;
      events: ReturnType<typeof event>[];
    }[];
    version: string;
  };
  route?: (originPlaceId: string, destinationPlaceId: string) => number;
  now?: string;
}) {
  const task = input?.task ?? summary();
  const availability = input?.availability ?? {
    participants: task.participants.map((participant, index) => ({
      userId: participant.userId,
      defaultPlaceId: `50000000-0000-4000-8000-00000000000${String(index + 1)}`,
      events: [],
    })),
    version: 'calendar-v1',
  };
  const tasks = {
    getSchedulingSummary: vi.fn().mockResolvedValue(task),
  } as unknown as TasksFacade;
  const calendar = {
    loadParticipantAvailability: vi.fn().mockResolvedValue(availability),
  } as unknown as CalendarAvailabilityFacade;
  const estimate = vi
    .fn()
    .mockImplementation(
      (value: { originPlaceId: string; destinationPlaceId: string }) =>
        Promise.resolve({
          durationSeconds:
            (input?.route?.(value.originPlaceId, value.destinationPlaceId) ??
              15) * 60,
        }),
    );
  const travel = {
    estimateBetweenPlaces: estimate,
  } as unknown as TravelEstimationFacade;
  const links = {
    findActive: vi.fn().mockResolvedValue(null),
  } as unknown as TaskCalendarLinkRepository;
  const clock = {
    now: () => new Date(input?.now ?? '2026-07-19T12:00:00.000Z'),
  };
  const tokens = new CandidateTokenService(
    {
      internalHealthToken: '12345678901234567890123456789012',
    } as AppConfigService,
    clock,
  );
  return {
    service: new SuggestTaskSlotsService(
      tasks,
      calendar,
      new SchedulingCandidateEvaluatorService(travel, tokens),
      links,
      clock,
    ),
    calendar,
    estimate,
    tokens,
    links,
  };
}

describe('task scheduling application services', () => {
  it('returns joint slots and uses each participant own default origin', async () => {
    const value = harness();
    const result = await value.service.execute(userId, taskId, request());
    expect(result.candidates).toHaveLength(3);
    expect(value.estimate).toHaveBeenCalledWith(
      expect.objectContaining({
        originPlaceId: '50000000-0000-4000-8000-000000000001',
      }),
    );
    expect(value.estimate).toHaveBeenCalledWith(
      expect.objectContaining({
        originPlaceId: '50000000-0000-4000-8000-000000000002',
      }),
    );
  });

  it('reproduces the long-event day and still evaluates the evening free interval', async () => {
    const longEvent = event(
      'long-shift',
      '2026-07-20T08:00:00.000Z',
      '2026-07-20T20:00:00.000Z',
      '50000000-0000-4000-8000-000000000009',
    );
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
      availability: {
        participants: [
          {
            userId,
            defaultPlaceId: '50000000-0000-4000-8000-000000000001',
            events: [longEvent],
          },
        ],
        version: 'calendar-v1',
      },
      route: () => 20,
    });
    const result = await value.service.execute(userId, taskId, request());
    expect(result.diagnostics.freeIntervals).toEqual([
      expect.objectContaining({
        startAt: '2026-07-20T06:00:00.000Z',
        endAt: '2026-07-20T08:00:00.000Z',
      }),
      expect.objectContaining({
        startAt: '2026-07-20T20:00:00.000Z',
        endAt: '2026-07-20T22:00:00.000Z',
      }),
    ]);
    expect(result.diagnostics.summary.timeCandidatesGenerated).toBe(10);
    expect(
      result.candidates.some(
        ({ startAt }) => startAt >= '2026-07-20T20:00:00.000Z',
      ),
    ).toBe(true);
  });

  it.each([60, 90, 120])(
    'fits a %i minute task into a two-hour interval without travel',
    async (duration) => {
      const value = harness({
        task: summary({
          estimatedDurationMinutes: duration,
          participants: [summary().participants[0]],
        }),
        availability: {
          participants: [
            {
              userId,
              defaultPlaceId: null,
              events: [
                event(
                  'long-shift',
                  '2026-07-20T08:00:00.000Z',
                  '2026-07-20T20:00:00.000Z',
                  null,
                ),
              ],
            },
          ],
          version: 'calendar-v1',
        },
      });
      const result = await value.service.execute(
        userId,
        taskId,
        request({
          earliestTime: '20:00',
          latestTime: '22:00',
          considerTravel: false,
        }),
      );
      expect(result.candidates[0]).toMatchObject({
        status: 'TRAVEL_NOT_VERIFIED',
      });
      expect(value.estimate).not.toHaveBeenCalled();
    },
  );

  it('moves the earliest candidate after previous event travel and buffer', async () => {
    const previous = event(
      'event-a',
      '2026-07-20T07:00:00.000Z',
      '2026-07-20T08:00:00.000Z',
      '50000000-0000-4000-8000-000000000009',
    );
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
      availability: {
        participants: [{ userId, defaultPlaceId: null, events: [previous] }],
        version: 'calendar-v1',
      },
      route: () => 20,
    });
    const result = await value.service.execute(userId, taskId, request());
    expect(result.candidates[0]?.startAt).toBe('2026-07-20T08:30:00.000Z');
  });

  it('rejects candidates that leave too little time to travel to the next event', async () => {
    const next = event(
      'event-next',
      '2026-07-20T10:00:00.000Z',
      '2026-07-20T11:00:00.000Z',
      '50000000-0000-4000-8000-000000000009',
    );
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
      availability: {
        participants: [
          {
            userId,
            defaultPlaceId: '50000000-0000-4000-8000-000000000001',
            events: [next],
          },
        ],
        version: 'calendar-v1',
      },
      route: () => 20,
    });
    const result = await value.service.execute(
      userId,
      taskId,
      request({
        earliestTime: '08:00',
        latestTime: '10:00',
        suggestionCount: 5,
      }),
    );
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates.at(-1)?.endAt).toBe('2026-07-20T09:30:00.000Z');
  });

  it('falls back to the participant default place when a previous event has no place', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
      availability: {
        participants: [
          {
            userId,
            defaultPlaceId: '50000000-0000-4000-8000-000000000001',
            events: [
              event(
                'event-without-place',
                '2026-07-20T06:00:00.000Z',
                '2026-07-20T07:00:00.000Z',
                null,
              ),
            ],
          },
        ],
        version: 'calendar-v1',
      },
    });
    await value.service.execute(userId, taskId, request());
    expect(value.estimate).toHaveBeenCalledWith(
      expect.objectContaining({
        originPlaceId: '50000000-0000-4000-8000-000000000001',
      }),
    );
  });

  it('returns a travel warning when a participant has no resolvable origin', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
      availability: {
        participants: [{ userId, defaultPlaceId: null, events: [] }],
        version: 'calendar-v1',
      },
    });
    const result = await value.service.execute(userId, taskId, request());
    expect(result.candidates[0]?.status).toBe('TRAVEL_NOT_VERIFIED');
    expect(result.candidates[0]?.warnings).toContain('TRAVEL_ORIGIN_UNKNOWN');
  });

  it('requires the candidate to be travel-feasible for every participant', async () => {
    const value = harness({
      route: (origin) => (origin.endsWith('002') ? 1_000 : 5),
    });
    const result = await value.service.execute(userId, taskId, request());
    expect(result.candidates).toEqual([]);
  });

  it('does not route a task without a confirmed location', async () => {
    const value = harness({ task: summary({ location: null }) });
    const result = await value.service.execute(userId, taskId, request());
    expect(value.estimate).not.toHaveBeenCalled();
    expect(result.candidates[0]?.warnings).toContain(
      'TASK_LOCATION_NOT_ROUTABLE',
    );
  });

  it('does not call routing when travel consideration is disabled', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
    });
    const result = await value.service.execute(
      userId,
      taskId,
      request({ considerTravel: false }),
    );
    expect(value.estimate).not.toHaveBeenCalled();
    expect(result.candidates[0]).toMatchObject({
      status: 'TRAVEL_NOT_VERIFIED',
      warnings: expect.arrayContaining(['TRAVEL_NOT_CONSIDERED']),
    });
  });

  it('clips only the elapsed part of today and rounds to the next quarter hour', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
      now: '2026-07-20T14:43:00.000Z',
    });
    const result = await value.service.execute(
      userId,
      taskId,
      request({ considerTravel: false }),
    );
    expect(result.diagnostics.effectiveWindow.startAt).toBe(
      '2026-07-20T14:45:00.000Z',
    );
    expect(result.candidates[0]?.startAt).toBe('2026-07-20T14:45:00.000Z');
    expect(result.diagnostics.rejections).toContainEqual({
      code: 'SEARCH_WINDOW_IN_PAST',
      count: 1,
    });
  });

  it('returns an explicit unverified state when routing fails', async () => {
    const value = harness();
    value.estimate.mockRejectedValue(new Error('timeout'));
    const result = await value.service.execute(userId, taskId, request());
    expect(result.candidates[0]?.status).toBe('TRAVEL_NOT_VERIFIED');
    expect(result.candidates[0]?.warnings).toContain('ROUTING_UNAVAILABLE');
  });

  it('bounds routing to the preliminary candidate set', async () => {
    const value = harness();
    await value.service.execute(userId, taskId, request());
    expect(value.estimate.mock.calls.length).toBeLessThanOrEqual(12);
  });

  it('ranks verified candidates before travel-unverified candidates', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
    });
    let calls = 0;
    value.estimate.mockImplementation(() => {
      calls += 1;
      return calls <= 4
        ? Promise.reject(new Error('timeout'))
        : Promise.resolve({ durationSeconds: 5 * 60 });
    });
    const result = await value.service.execute(userId, taskId, request());
    expect(result.candidates.map((candidate) => candidate.status)).toEqual([
      'FEASIBLE',
      'FEASIBLE',
      'TRAVEL_NOT_VERIFIED',
    ]);
  });

  it('refuses to suggest slots for an already scheduled task', async () => {
    const value = harness();
    vi.mocked(value.links.findActive).mockResolvedValue({
      id: 'link',
      householdId,
      taskId,
      calendarEventId: 'event',
      createdAt: new Date(),
    });
    await expect(
      value.service.execute(userId, taskId, request()),
    ).rejects.toMatchObject({ code: 'TASK_ALREADY_SCHEDULED' });
  });

  it('revalidates the original calendar window before confirmation', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
    });
    const suggestions = await value.service.execute(userId, taskId, request());
    const token = suggestions.candidates[0]?.candidateToken ?? '';
    const calendar = {
      loadParticipantAvailability: vi.fn().mockResolvedValue({
        participants: [{ userId, defaultPlaceId: null, events: [] }],
        version: 'calendar-v2',
      }),
    } as unknown as CalendarAvailabilityFacade;
    const confirm = new ConfirmTaskSlotService(
      {
        getSchedulingSummary: vi
          .fn()
          .mockResolvedValue(
            summary({ participants: [summary().participants[0]] }),
          ),
      } as unknown as TasksFacade,
      calendar,
      {
        createTaskLinkedEvent: vi.fn(),
      } as unknown as CalendarEventCreationFacade,
      value.tokens,
      {
        findActive: vi.fn().mockResolvedValue(null),
      } as unknown as TaskCalendarLinkRepository,
    );
    await expect(confirm.execute(userId, taskId, token)).rejects.toMatchObject({
      code: 'SCHEDULING_SLOT_CHANGED',
    });
    expect(
      vi.mocked(calendar.loadParticipantAvailability),
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        from: new Date('2026-07-20T06:00:00.000Z'),
        to: new Date('2026-07-20T22:00:00.000Z'),
      }),
    );
  });

  it('uses the signed route mode and buffer when creating the linked event', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
    });
    const suggestions = await value.service.execute(
      userId,
      taskId,
      request({ routeMode: 'FOOT_FAST', travelBufferMinutes: 25 }),
    );
    const createTaskLinkedEvent = vi.fn().mockResolvedValue({
      eventId: '40000000-0000-4000-8000-000000000009',
      startsAt: suggestions.candidates[0]?.startAt,
      endsAt: suggestions.candidates[0]?.endAt,
    });
    const confirm = new ConfirmTaskSlotService(
      {
        getSchedulingSummary: vi
          .fn()
          .mockResolvedValue(
            summary({ participants: [summary().participants[0]] }),
          ),
      } as unknown as TasksFacade,
      value.calendar,
      { createTaskLinkedEvent } as unknown as CalendarEventCreationFacade,
      value.tokens,
      {
        findActive: vi.fn().mockResolvedValue(null),
      } as unknown as TaskCalendarLinkRepository,
    );

    await confirm.execute(
      userId,
      taskId,
      suggestions.candidates[0]?.candidateToken ?? '',
    );

    expect(createTaskLinkedEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        routeMode: 'FOOT_FAST',
        travelBufferMinutes: 25,
      }),
    );
  });

  it('rejects a candidate when a new overlapping event appears during revalidation', async () => {
    const value = harness({
      task: summary({ participants: [summary().participants[0]] }),
    });
    const suggestions = await value.service.execute(userId, taskId, request());
    const selected = suggestions.candidates[0];
    const confirm = new ConfirmTaskSlotService(
      {
        getSchedulingSummary: vi
          .fn()
          .mockResolvedValue(
            summary({ participants: [summary().participants[0]] }),
          ),
      } as unknown as TasksFacade,
      {
        loadParticipantAvailability: vi.fn().mockResolvedValue({
          participants: [
            {
              userId,
              defaultPlaceId: null,
              events: [
                event(
                  'new-event',
                  selected?.startAt ?? '',
                  selected?.endAt ?? '',
                  null,
                ),
              ],
            },
          ],
          version: 'calendar-v1',
        }),
      } as unknown as CalendarAvailabilityFacade,
      {
        createTaskLinkedEvent: vi.fn(),
      } as unknown as CalendarEventCreationFacade,
      value.tokens,
      {
        findActive: vi.fn().mockResolvedValue(null),
      } as unknown as TaskCalendarLinkRepository,
    );
    await expect(
      confirm.execute(userId, taskId, selected?.candidateToken ?? ''),
    ).rejects.toMatchObject({ code: 'SCHEDULING_SLOT_CHANGED' });
  });

  it('maps a concurrent second confirmation to already scheduled', async () => {
    const tokens = new CandidateTokenService(
      {
        internalHealthToken: '12345678901234567890123456789012',
      } as AppConfigService,
      { now: () => new Date('2026-07-19T12:00:00.000Z') },
    );
    const token = tokens.sign({
      taskId,
      startAt: '2026-07-20T08:00:00.000Z',
      endAt: '2026-07-20T09:00:00.000Z',
      windowStart: '2026-07-20T06:00:00.000Z',
      windowEnd: '2026-07-20T22:00:00.000Z',
      timezone: 'UTC',
      routeMode: 'CAR_FAST_TRAFFIC',
      travelBufferMinutes: 10,
      considerTravel: true,
      expiresAt: '2026-07-19T12:01:00.000Z',
      taskVersion: 'task-v1',
      calendarVersion: 'calendar-v1',
    });
    const links = {
      findActive: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 'link',
        householdId,
        taskId,
        calendarEventId: 'event',
        createdAt: new Date(),
      }),
    } as unknown as TaskCalendarLinkRepository;
    const confirm = new ConfirmTaskSlotService(
      {
        getSchedulingSummary: vi.fn().mockResolvedValue(summary()),
      } as unknown as TasksFacade,
      {
        loadParticipantAvailability: vi.fn().mockResolvedValue({
          participants: summary().participants.map((participant) => ({
            userId: participant.userId,
            defaultPlaceId: null,
            events: [],
          })),
          version: 'calendar-v1',
        }),
      } as unknown as CalendarAvailabilityFacade,
      {
        createTaskLinkedEvent: vi.fn().mockRejectedValue(new Error('unique')),
      } as unknown as CalendarEventCreationFacade,
      tokens,
      links,
    );
    await expect(confirm.execute(userId, taskId, token)).rejects.toMatchObject({
      code: 'TASK_ALREADY_SCHEDULED',
    });
  });
});
