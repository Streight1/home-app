import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type { CalendarEventRepository } from '../domain/ports/calendar-event.repository.js';
import {
  calendarEventInclude,
  toCalendarEventRecord,
} from './prisma-calendar.mapper.js';

@Injectable()
export class PrismaCalendarEventRepository implements CalendarEventRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async findById(householdId: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, householdId, deletedAt: null },
      include: calendarEventInclude,
    });
    return event ? toCalendarEventRecord(event) : null;
  }

  public async findManyByIds(householdId: string, eventIds: string[]) {
    return (
      await this.prisma.calendarEvent.findMany({
        where: { id: { in: eventIds }, householdId, deletedAt: null },
        include: calendarEventInclude,
        orderBy: { id: 'asc' },
      })
    ).map(toCalendarEventRecord);
  }

  public async list(householdId: string, from: Date, to: Date) {
    const fromDate = new Date(`${from.toISOString().slice(0, 10)}T00:00:00Z`);
    const toDate = new Date(`${to.toISOString().slice(0, 10)}T00:00:00Z`);
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        householdId,
        deletedAt: null,
        OR: [
          {
            isAllDay: false,
            startsAt: { lt: to },
            endsAt: { gt: from },
          },
          {
            isAllDay: true,
            allDayStartDate: { lte: toDate },
            allDayEndDateExclusive: { gt: fromDate },
          },
        ],
      },
      include: calendarEventInclude,
      orderBy: [{ allDayStartDate: 'asc' }, { startsAt: 'asc' }, { id: 'asc' }],
      take: 1000,
    });
    return events.map(toCalendarEventRecord);
  }

  public async create(input: Parameters<CalendarEventRepository['create']>[0]) {
    const id = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.calendarEvent.create({
        data: {
          householdId: input.householdId,
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
          ...input.event,
          participants: { create: input.event.participants },
        },
        select: { id: true },
      });
      await this.audit.record(transaction, {
        action: 'CALENDAR_EVENT_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarEvent',
        entityId: created.id,
        metadata: { eventId: created.id, eventType: input.event.type },
      });
      return created.id;
    });
    const created = await this.findById(input.householdId, id);
    if (!created) throw new Error('CALENDAR_EVENT_CREATE_FAILED');
    return created;
  }

  public async createTaskLinked(
    input: Parameters<CalendarEventRepository['createTaskLinked']>[0],
  ) {
    const eventId = randomUUID();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.calendarEvent.create({
        data: {
          id: eventId,
          householdId: input.householdId,
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
          ...input.event,
          source: 'TASK',
          participants: { create: input.event.participants },
        },
      });
      await transaction.taskCalendarLink.create({
        data: {
          householdId: input.householdId,
          taskId: input.taskId,
          calendarEventId: eventId,
          createdByUserId: input.userId,
        },
      });
      await this.audit.record(transaction, {
        action: 'TASK_SCHEDULED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'TaskCalendarLink',
        entityId: input.taskId,
        metadata: { taskId: input.taskId, calendarEventId: eventId },
      });
    });
    const created = await this.findById(input.householdId, eventId);
    if (!created) throw new Error('TASK_CALENDAR_EVENT_CREATE_FAILED');
    return created;
  }

  public async removeTaskLinked(
    input: Parameters<CalendarEventRepository['removeTaskLinked']>[0],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const link = await transaction.taskCalendarLink.findFirst({
        where: {
          householdId: input.householdId,
          taskId: input.taskId,
          calendarEventId: input.calendarEventId,
          removedAt: null,
        },
        select: { id: true },
      });
      if (!link) return false;
      await transaction.calendarEvent.updateMany({
        where: {
          id: input.calendarEventId,
          householdId: input.householdId,
          source: 'TASK',
          deletedAt: null,
        },
        data: {
          deletedAt: input.removedAt,
          deletedByUserId: input.userId,
          updatedByUserId: input.userId,
        },
      });
      await transaction.calendarEventTravelPlan.deleteMany({
        where: {
          householdId: input.householdId,
          eventId: input.calendarEventId,
        },
      });
      await transaction.calendarEventTravelPlan.updateMany({
        where: {
          householdId: input.householdId,
          previousEventId: input.calendarEventId,
        },
        data: { previousEventId: null, status: 'STALE' },
      });
      await transaction.taskCalendarLink.update({
        where: { id: link.id },
        data: { removedAt: input.removedAt },
      });
      await this.audit.record(transaction, {
        action: 'TASK_UNSCHEDULED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'TaskCalendarLink',
        entityId: input.taskId,
        metadata: { taskId: input.taskId },
      });
      return true;
    });
  }

  public async update(input: Parameters<CalendarEventRepository['update']>[0]) {
    const { participants: _participants, ...eventData } = input.event;
    void _participants;
    const changed = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.calendarEvent.updateMany({
        where: {
          id: input.eventId,
          householdId: input.householdId,
          deletedAt: null,
        },
        data: {
          ...eventData,
          updatedByUserId: input.userId,
          templateApplicationBatchId: null,
        },
      });
      if (result.count === 0) return false;
      await transaction.calendarEventParticipant.deleteMany({
        where: { eventId: input.eventId },
      });
      if (input.event.participants.length) {
        await transaction.calendarEventParticipant.createMany({
          data: input.event.participants.map((participant) => ({
            eventId: input.eventId,
            ...participant,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'CALENDAR_EVENT_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarEvent',
        entityId: input.eventId,
        metadata: {
          eventId: input.eventId,
          changedFields: input.changedFields,
        },
      });
      return true;
    });
    return changed ? this.findById(input.householdId, input.eventId) : null;
  }

  public async cancel(input: Parameters<CalendarEventRepository['cancel']>[0]) {
    const changed = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.calendarEvent.updateMany({
        where: {
          id: input.eventId,
          householdId: input.householdId,
          deletedAt: null,
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: input.now,
          updatedByUserId: input.userId,
          templateApplicationBatchId: null,
        },
      });
      if (result.count === 0) return false;
      await this.audit.record(transaction, {
        action: 'CALENDAR_EVENT_CANCELLED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarEvent',
        entityId: input.eventId,
        metadata: { eventId: input.eventId },
      });
      return true;
    });
    return changed ? this.findById(input.householdId, input.eventId) : null;
  }

  public async delete(input: Parameters<CalendarEventRepository['delete']>[0]) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.calendarEvent.findFirst({
        where: {
          id: input.eventId,
          householdId: input.householdId,
          deletedAt: null,
        },
        select: { id: true, type: true, source: true },
      });
      if (!existing) return false;
      await transaction.calendarEvent.update({
        where: { id: input.eventId },
        data: {
          deletedAt: input.deletedAt,
          deletedByUserId: input.userId,
          updatedByUserId: input.userId,
        },
      });
      await transaction.taskCalendarLink.updateMany({
        where: {
          householdId: input.householdId,
          calendarEventId: input.eventId,
          removedAt: null,
        },
        data: { removedAt: input.deletedAt },
      });
      await transaction.calendarEventTravelPlan.deleteMany({
        where: { householdId: input.householdId, eventId: input.eventId },
      });
      await transaction.calendarEventTravelPlan.updateMany({
        where: {
          householdId: input.householdId,
          previousEventId: input.eventId,
        },
        data: { previousEventId: null, status: 'STALE' },
      });
      await this.audit.record(transaction, {
        action: 'CALENDAR_EVENT_DELETED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarEvent',
        entityId: input.eventId,
        metadata: {
          eventId: input.eventId,
          eventType: existing.type,
          eventSource: existing.source,
        },
      });
      return true;
    });
  }

  public async bulkUpdate(
    input: Parameters<CalendarEventRepository['bulkUpdate']>[0],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.calendarEvent.count({
        where: {
          id: { in: input.eventIds },
          householdId: input.householdId,
          deletedAt: null,
        },
      });
      if (existing !== input.eventIds.length) return 0;
      const eventPatch = {
        ...(input.colorToken !== undefined
          ? { colorToken: input.colorToken }
          : {}),
        ...(input.eventType !== undefined ? { type: input.eventType } : {}),
        ...(input.location
          ? {
              location: input.location.label,
              locationPlaceId: input.location.placeId,
              locationLabel: input.location.label,
            }
          : {}),
        ...(input.calculateTravel !== undefined
          ? { calculateTravel: input.calculateTravel }
          : {}),
        updatedByUserId: input.userId,
        templateApplicationBatchId: null,
      };
      await transaction.calendarEvent.updateMany({
        where: { id: { in: input.eventIds }, householdId: input.householdId },
        data: eventPatch,
      });
      if (input.participants) {
        if (input.participants.operation === 'REPLACE') {
          await transaction.calendarEventParticipant.deleteMany({
            where: { eventId: { in: input.eventIds } },
          });
        } else if (input.participants.operation === 'REMOVE') {
          await transaction.calendarEventParticipant.deleteMany({
            where: {
              eventId: { in: input.eventIds },
              userId: { in: input.participants.userIds },
            },
          });
        }
        if (
          input.participants.operation === 'ADD' ||
          input.participants.operation === 'REPLACE'
        ) {
          await transaction.calendarEventParticipant.createMany({
            data: input.eventIds.flatMap(
              (eventId) =>
                input.participants?.userIds.map((userId) => ({
                  eventId,
                  userId,
                  role: 'ATTENDEE' as const,
                })) ?? [],
            ),
            skipDuplicates: true,
          });
        }
      }
      if (
        input.location !== undefined ||
        input.calculateTravel !== undefined ||
        input.routeMode !== undefined ||
        input.travelBufferMinutes !== undefined
      ) {
        await transaction.calendarEventTravelPlan.updateMany({
          where: {
            householdId: input.householdId,
            eventId: { in: input.eventIds },
          },
          data: {
            ...(input.routeMode ? { routeMode: input.routeMode } : {}),
            ...(input.travelBufferMinutes !== undefined
              ? { travelBufferMinutes: input.travelBufferMinutes }
              : {}),
            status: 'STALE',
          },
        });
      }
      await this.audit.record(transaction, {
        action: 'CALENDAR_EVENTS_BULK_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarEvent',
        metadata: {
          eventCount: input.eventIds.length,
          changedFields: input.changedFields,
        },
      });
      return input.eventIds.length;
    });
  }

  public async bulkDelete(
    input: Parameters<CalendarEventRepository['bulkDelete']>[0],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.calendarEvent.count({
        where: {
          id: { in: input.eventIds },
          householdId: input.householdId,
          deletedAt: null,
        },
      });
      if (existing !== input.eventIds.length) return 0;
      await transaction.calendarEvent.updateMany({
        where: { id: { in: input.eventIds }, householdId: input.householdId },
        data: {
          deletedAt: input.deletedAt,
          deletedByUserId: input.userId,
          updatedByUserId: input.userId,
        },
      });
      await transaction.taskCalendarLink.updateMany({
        where: {
          householdId: input.householdId,
          calendarEventId: { in: input.eventIds },
          removedAt: null,
        },
        data: { removedAt: input.deletedAt },
      });
      await transaction.calendarEventTravelPlan.deleteMany({
        where: {
          householdId: input.householdId,
          eventId: { in: input.eventIds },
        },
      });
      await transaction.calendarEventTravelPlan.updateMany({
        where: {
          householdId: input.householdId,
          previousEventId: { in: input.eventIds },
        },
        data: { previousEventId: null, status: 'STALE' },
      });
      await this.audit.record(transaction, {
        action: 'CALENDAR_EVENTS_BULK_DELETED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarEvent',
        metadata: {
          eventCount: input.eventIds.length,
          taskEventCount: input.taskEventCount,
          templateEventCount: input.templateEventCount,
        },
      });
      return input.eventIds.length;
    });
  }

  public async countShiftConflicts(
    input: Parameters<CalendarEventRepository['countShiftConflicts']>[0],
  ) {
    if (!input.participantIds.length) return 0;
    return this.prisma.calendarEvent.count({
      where: {
        householdId: input.householdId,
        deletedAt: null,
        type: 'WORK_SHIFT',
        status: 'ACTIVE',
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
        participants: { some: { userId: { in: input.participantIds } } },
        ...(input.excludeEventId ? { id: { not: input.excludeEventId } } : {}),
      },
    });
  }

  public today(householdId: string, start: Date, end: Date, limit: number) {
    return this.list(householdId, start, end).then((events) =>
      events.filter((event) => event.status === 'ACTIVE').slice(0, limit),
    );
  }
}
