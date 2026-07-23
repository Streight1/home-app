import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import { CalendarEventValidationService } from '../src/modules/calendar/application/events/calendar-event-validation.service.js';
import { DeleteCalendarEventService } from '../src/modules/calendar/application/events/delete-calendar-event.service.js';
import type { EventLocationValidationService } from '../src/modules/calendar/application/events/event-location-validation.service.js';
import { GetCalendarFeedService } from '../src/modules/calendar/application/feed/get-calendar-feed.service.js';
import { CalendarResponseMapper } from '../src/modules/calendar/application/mappers/calendar-response.mapper.js';
import { BulkApplyCalendarTemplateService } from '../src/modules/calendar/application/templates/bulk-apply-calendar-template.service.js';
import { CalendarTemplateValidationService } from '../src/modules/calendar/application/templates/calendar-template-validation.service.js';
import { RevertCalendarTemplateBatchService } from '../src/modules/calendar/application/templates/revert-calendar-template-batch.service.js';
import type {
  CalendarEventRecord,
  CalendarTemplateRecord,
} from '../src/modules/calendar/domain/calendar.types.js';
import type { CalendarEventRepository } from '../src/modules/calendar/domain/ports/calendar-event.repository.js';
import type { CalendarTemplateRepository } from '../src/modules/calendar/domain/ports/calendar-template.repository.js';
import type { CalendarClockPort } from '../src/modules/calendar/domain/ports/clock.port.js';
import { TaskCalendarSource } from '../src/modules/calendar/infrastructure/feed-sources/task-calendar.source.js';
import { ManualCalendarEventSource } from '../src/modules/calendar/infrastructure/feed-sources/manual-calendar-event.source.js';
import { PrismaCalendarEventRepository } from '../src/modules/calendar/infrastructure/prisma-calendar-event.repository.js';
import { PrismaCalendarTemplateRepository } from '../src/modules/calendar/infrastructure/prisma-calendar-template.repository.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import type { TasksFacade } from '../src/modules/tasks/tasks.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const templateId = '30000000-0000-4000-8000-000000000003';

function access(role: 'MEMBER' | 'VIEWER' = 'MEMBER') {
  return {
    assertActiveMembers: vi.fn().mockResolvedValue(undefined),
    getActiveMembership: vi.fn().mockImplementation((_userId, minimum) => {
      if (role === 'VIEWER' && minimum === 'MEMBER')
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'HOUSEHOLD_ACCESS_DENIED',
          'Zakázáno.',
        );
      return Promise.resolve({ householdId, role });
    }),
  } as unknown as HouseholdAccessService;
}

function template(
  patch: Partial<CalendarTemplateRecord> = {},
): CalendarTemplateRecord {
  return {
    id: templateId,
    householdId,
    name: 'Noční',
    title: 'Noční směna',
    description: null,
    eventType: 'WORK_SHIFT',
    startLocalTime: '18:00',
    endLocalTime: '06:00',
    endDayOffset: 1,
    timezone: 'Europe/Prague',
    isAllDay: false,
    defaultLocation: null,
    locationPlaceId: null,
    locationLabel: null,
    calculateTravel: true,
    routeMode: 'CAR_FAST_TRAFFIC',
    travelBufferMinutes: 10,
    colorToken: 'blue',
    createdAt: new Date('2026-07-01T00:00:00Z'),
    updatedAt: new Date('2026-07-01T00:00:00Z'),
    participants: [{ userId, role: 'ASSIGNEE' }],
    ...patch,
  };
}

function eventRecord(
  patch: Partial<CalendarEventRecord> = {},
): CalendarEventRecord {
  return {
    id: '40000000-0000-4000-8000-000000000004',
    householdId,
    title: 'Noční směna',
    description: null,
    type: 'WORK_SHIFT',
    status: 'ACTIVE',
    startsAt: new Date('2026-07-15T16:00:00Z'),
    endsAt: new Date('2026-07-16T04:00:00Z'),
    timezone: 'Europe/Prague',
    isAllDay: false,
    location: null,
    locationPlaceId: null,
    locationLabel: null,
    locationNotes: null,
    calculateTravel: true,
    colorToken: 'blue',
    source: 'TEMPLATE',
    templateId,
    templateApplicationBatchId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [
      {
        role: 'ASSIGNEE',
        user: {
          id: userId,
          email: 'jana@example.test',
          displayName: 'Jana',
          avatarUrl: null,
          calendarColorToken: 'rose',
        },
      },
    ],
    taskLink: null,
    ...patch,
  };
}

function templateValidation() {
  return new CalendarTemplateValidationService(access(), {
    assertVisible: vi.fn().mockResolvedValue(undefined),
  } as unknown as EventLocationValidationService);
}

describe('shared household calendar domain', () => {
  it('creates one overnight occurrence with the end on the next day', () => {
    const result = templateValidation().occurrence(template(), '2026-07-15');
    expect(result.event.startsAt).toEqual(new Date('2026-07-15T16:00:00.000Z'));
    expect(result.event.endsAt).toEqual(new Date('2026-07-16T04:00:00.000Z'));
    expect(result.event.endsAt > result.event.startsAt).toBe(true);
  });

  it('keeps a template destination and enables travel without storing an origin', () => {
    const result = templateValidation().occurrence(
      template({
        locationPlaceId: '70000000-0000-4000-8000-000000000007',
        locationLabel: 'Veřejná instituce',
        calculateTravel: true,
      }),
      '2026-07-15',
    );
    expect(result.event).toMatchObject({
      locationPlaceId: '70000000-0000-4000-8000-000000000007',
      locationLabel: 'Veřejná instituce',
      calculateTravel: true,
    });
    expect(JSON.stringify(template())).not.toMatch(
      /originPlaceId|previousEventId/,
    );
  });

  it('rejects a nonexistent Prague local time during spring DST', () => {
    const validation = templateValidation();
    expect(() =>
      validation.occurrence(
        template({
          startLocalTime: '02:30',
          endLocalTime: '04:00',
          endDayOffset: 0,
        }),
        '2026-03-29',
      ),
    ).toThrow(expect.objectContaining({ code: 'CALENDAR_INVALID_INPUT' }));
  });

  it('uses the earlier offset deterministically for an ambiguous autumn time', () => {
    const result = templateValidation().occurrence(
      template({
        startLocalTime: '02:30',
        endLocalTime: '04:00',
        endDayOffset: 0,
      }),
      '2026-10-25',
    );
    expect(result.usedEarlierOffset).toBe(true);
    expect(result.event.startsAt).toEqual(new Date('2026-10-25T00:30:00.000Z'));
  });

  it('allows multiple household participants for a normal event', async () => {
    const events = {
      countShiftConflicts: vi.fn(),
    } as unknown as CalendarEventRepository;
    const validation = new CalendarEventValidationService(access(), events);
    const result = await validation.create(householdId, {
      title: 'Rodinná oslava',
      type: 'HOUSEHOLD',
      startsAt: '2026-07-15T10:00:00Z',
      endsAt: '2026-07-15T12:00:00Z',
      timezone: 'Europe/Prague',
      isAllDay: false,
      colorToken: 'primary',
      participantIds: [userId, '50000000-0000-4000-8000-000000000005'],
      calculateTravel: true,
      allowShiftConflict: false,
    });
    expect(result.participants).toHaveLength(2);
    expect(events.countShiftConflicts).not.toHaveBeenCalled();
  });

  it('detects a same-member work shift conflict unless explicitly confirmed', async () => {
    const events = {
      countShiftConflicts: vi.fn().mockResolvedValue(1),
    } as unknown as CalendarEventRepository;
    const validation = new CalendarEventValidationService(access(), events);
    const input = {
      title: 'Směna',
      type: 'WORK_SHIFT' as const,
      startsAt: '2026-07-15T16:00:00Z',
      endsAt: '2026-07-16T04:00:00Z',
      timezone: 'Europe/Prague',
      isAllDay: false,
      colorToken: 'blue' as const,
      participantIds: [userId],
      calculateTravel: true,
      allowShiftConflict: false,
    };
    await expect(validation.create(householdId, input)).rejects.toMatchObject({
      code: 'CALENDAR_SHIFT_CONFLICT',
    });
    await expect(
      validation.create(householdId, { ...input, allowShiftConflict: true }),
    ).resolves.toMatchObject({ type: 'WORK_SHIFT' });
  });

  it('submits all selected template dates to one transactional repository call', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(template()),
      apply: vi.fn().mockResolvedValue({
        batchId: '60000000-0000-4000-8000-000000000006',
        events: [eventRecord(), eventRecord()],
      }),
    } as unknown as CalendarTemplateRepository;
    const service = new BulkApplyCalendarTemplateService(
      access(),
      repository,
      {
        countShiftConflicts: vi.fn().mockResolvedValue(0),
      } as unknown as CalendarEventRepository,
      templateValidation(),
      new CalendarResponseMapper(),
      {
        configureAutoForEvent: vi.fn().mockResolvedValue([]),
      } as never,
    );
    const result = await service.execute(userId, templateId, {
      dates: ['2026-07-15', '2026-07-17'],
      allowShiftConflicts: false,
    });
    expect(result.eventCount).toBe(2);
    expect(repository.apply).toHaveBeenCalledTimes(1);
    expect(repository.apply).toHaveBeenCalledWith(
      expect.objectContaining({
        events: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
        ]),
      }),
    );
  });

  it('refuses rollback when the repository detects a manually detached event', async () => {
    const service = new RevertCalendarTemplateBatchService(
      access(),
      {
        revert: vi.fn().mockResolvedValue(false),
      } as unknown as CalendarTemplateRepository,
      { now: () => new Date('2026-07-15T10:00:00Z') } as CalendarClockPort,
    );
    await expect(
      service.execute(userId, '60000000-0000-4000-8000-000000000006'),
    ).rejects.toMatchObject({ code: 'CALENDAR_BATCH_NOT_REVERTIBLE' });
  });

  it('skips an already deleted template event during batch rollback without restoring it', async () => {
    const activeEventId = '40000000-0000-4000-8000-000000000004';
    const transaction = {
      calendarTemplateApplicationBatch: {
        findFirst: vi.fn().mockResolvedValue({
          id: '60000000-0000-4000-8000-000000000006',
          eventCount: 2,
          templateId,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      calendarEvent: {
        count: vi.fn().mockResolvedValue(2),
        findMany: vi.fn().mockResolvedValue([{ id: activeEventId }]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      taskCalendarLink: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      calendarEventTravelPlan: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const repository = new PrismaCalendarTemplateRepository(
      {
        $transaction: vi
          .fn()
          .mockImplementation(
            async (
              callback: (client: typeof transaction) => Promise<unknown>,
            ) => callback(transaction),
          ),
      } as unknown as PrismaService,
      {
        record: vi.fn().mockResolvedValue(undefined),
      } as unknown as AuditService,
    );
    const now = new Date('2026-07-15T12:00:00.000Z');
    await expect(
      repository.revert({ householdId, userId, batchId: 'batch', now }),
    ).resolves.toBe(true);
    expect(transaction.calendarEvent.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [activeEventId] } },
      data: {
        deletedAt: now,
        deletedByUserId: userId,
        updatedByUserId: userId,
      },
    });
  });

  it('maps tasks to feed items without creating CalendarEvent data', async () => {
    const facade = {
      calendarFeed: vi.fn().mockResolvedValue([
        {
          id: 'task',
          title: 'Revize',
          start: '2026-07-15T10:00:00Z',
          end: null,
          status: 'OPEN',
          priority: 'HIGH',
          isAllDay: false,
          canComplete: true,
          navigationTarget: {
            area: 'tasks',
            screen: 'detail',
            taskId: 'task',
          },
        },
      ]),
    } as unknown as TasksFacade;
    const source = new TaskCalendarSource(facade);
    const result = await source.list({
      userId,
      householdId,
      from: new Date('2026-07-01'),
      to: new Date('2026-08-01'),
      canMutate: true,
    });
    expect(result[0]).toMatchObject({ sourceType: 'TASK', id: 'task' });
    expect(JSON.stringify(result)).not.toContain('CalendarEvent');
  });

  it('sorts independent manual and task feed sources by start', async () => {
    const service = new GetCalendarFeedService(
      access(),
      {
        list: vi.fn().mockResolvedValue([
          {
            sourceType: 'CALENDAR_EVENT',
            id: 'later',
            title: 'B',
            start: '2026-07-16T10:00:00Z',
            end: '2026-07-16T11:00:00Z',
            status: 'ACTIVE',
            eventType: 'GENERAL',
            colorToken: 'primary',
            isAllDay: false,
            participants: [],
            navigationTarget: {
              area: 'calendar',
              screen: 'detail',
              eventId: 'later',
            },
          },
        ]),
      } as never,
      {
        list: vi.fn().mockResolvedValue([
          {
            sourceType: 'TASK',
            id: 'earlier',
            title: 'A',
            start: '2026-07-15T10:00:00Z',
            end: null,
            status: 'OPEN',
            priority: 'HIGH',
            isAllDay: false,
            canComplete: true,
            navigationTarget: {
              area: 'tasks',
              screen: 'detail',
              taskId: 'earlier',
            },
          },
        ]),
      } as never,
    );
    const result = await service.execute(
      userId,
      '2026-07-01T00:00:00Z',
      '2026-08-01T00:00:00Z',
    );
    expect(result.items.map(({ id }) => id)).toEqual(['earlier', 'later']);
  });

  it('never exposes household, batch or storage internals through the event mapper', () => {
    const response = new CalendarResponseMapper().event(eventRecord());
    expect(response).not.toHaveProperty('householdId');
    expect(response).not.toHaveProperty('templateApplicationBatchId');
    expect(JSON.stringify(response)).not.toContain('storageKey');
  });

  it('keeps a completed linked task event in history without a completion action', async () => {
    const source = new ManualCalendarEventSource(
      {
        list: vi.fn().mockResolvedValue([
          eventRecord({
            source: 'TASK',
            taskLink: { taskId: 'task-id', status: 'COMPLETED' },
          }),
        ]),
      } as unknown as CalendarEventRepository,
      { list: vi.fn().mockResolvedValue({ items: [] }) } as never,
    );
    const result = await source.list({
      userId,
      householdId,
      from: new Date('2026-07-01'),
      to: new Date('2026-08-01'),
      canMutate: true,
    });
    expect(result[0]).toMatchObject({
      sourceType: 'CALENDAR_EVENT',
      taskLink: { taskId: 'task-id', status: 'COMPLETED', canComplete: false },
    });
  });

  it('projects travel strictly from departure through route duration and leaves the buffer outside', async () => {
    const target = eventRecord({
      title: 'Plavání',
      startsAt: new Date('2026-07-15T19:00:00.000Z'),
    });
    const source = new ManualCalendarEventSource(
      {
        list: vi.fn().mockResolvedValue([target]),
      } as unknown as CalendarEventRepository,
      {
        list: vi.fn().mockResolvedValue({
          items: [
            {
              id: 'travel-plan',
              travelerUserId: userId,
              status: 'READY',
              departureAt: '2026-07-15T18:20:00.000Z',
              durationSeconds: 1_800,
              distanceMeters: 18_400,
              travelBufferMinutes: 10,
              routeMode: 'CAR_FAST_TRAFFIC',
              conflict: { hasConflict: false, missingSeconds: 0 },
            },
          ],
        }),
      } as never,
    );
    const result = await source.list({
      userId,
      householdId,
      from: new Date('2026-07-15T00:00:00.000Z'),
      to: new Date('2026-07-16T00:00:00.000Z'),
      canMutate: true,
    });
    expect(
      result.find(({ sourceType }) => sourceType === 'TRAVEL_BLOCK'),
    ).toMatchObject({
      title: 'Cesta na Plavání',
      start: '2026-07-15T18:20:00.000Z',
      end: '2026-07-15T18:50:00.000Z',
      eventStartsAt: '2026-07-15T19:00:00.000Z',
      bufferMinutes: 10,
    });
  });

  it('soft-deletes a task event, removes its active link and keeps the task row untouched', async () => {
    const transaction = {
      calendarEvent: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'event-id',
          type: 'HOUSEHOLD',
          source: 'TASK',
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      taskCalendarLink: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      calendarEventTravelPlan: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const repository = new PrismaCalendarEventRepository(
      {
        $transaction: vi
          .fn()
          .mockImplementation(
            async (
              callback: (client: typeof transaction) => Promise<unknown>,
            ) => callback(transaction),
          ),
      } as unknown as PrismaService,
      {
        record: vi.fn().mockResolvedValue(undefined),
      } as unknown as AuditService,
    );
    const deletedAt = new Date('2026-07-15T12:00:00.000Z');
    await expect(
      repository.delete({
        householdId,
        userId,
        eventId: 'event-id',
        deletedAt,
      }),
    ).resolves.toBe(true);
    expect(transaction.calendarEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt }) }),
    );
    expect(transaction.taskCalendarLink.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { removedAt: deletedAt } }),
    );
    expect(transaction).not.toHaveProperty('task.delete');
  });

  it('enforces member access before deleting an event', async () => {
    const remove = vi.fn();
    const service = new DeleteCalendarEventService(
      access('VIEWER'),
      { delete: remove } as unknown as CalendarEventRepository,
      { now: () => new Date('2026-07-15T12:00:00.000Z') },
    );
    await expect(service.execute(userId, 'event-id')).rejects.toMatchObject({
      code: 'HOUSEHOLD_ACCESS_DENIED',
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('uses the participant color for a single-person event', () => {
    const response = new CalendarResponseMapper().event(eventRecord());
    expect(response.visual).toEqual({ colorToken: 'rose', isShared: false });
  });

  it('uses the shared visual model for a multi-person event', () => {
    const first = eventRecord().participants[0];
    const response = new CalendarResponseMapper().event(
      eventRecord({
        participants: [
          ...(first ? [first] : []),
          {
            role: 'ATTENDEE',
            user: {
              id: '50000000-0000-4000-8000-000000000005',
              email: 'adam@example.test',
              displayName: 'Adam',
              avatarUrl: null,
              calendarColorToken: 'blue',
            },
          },
        ],
      }),
    );
    expect(response.visual).toEqual({ colorToken: 'shared', isShared: true });
    expect(response.participants).toHaveLength(2);
  });
});
