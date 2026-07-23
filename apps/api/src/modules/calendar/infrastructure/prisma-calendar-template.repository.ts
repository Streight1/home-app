import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type { CalendarTemplateRepository } from '../domain/ports/calendar-template.repository.js';
import {
  calendarEventInclude,
  calendarTemplateInclude,
  toCalendarEventRecord,
  toCalendarTemplateRecord,
} from './prisma-calendar.mapper.js';

@Injectable()
export class PrismaCalendarTemplateRepository implements CalendarTemplateRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public async list(householdId: string) {
    return (
      await this.prisma.calendarTemplate.findMany({
        where: { householdId },
        include: calendarTemplateInclude,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      })
    ).map(toCalendarTemplateRecord);
  }

  public async findById(householdId: string, templateId: string) {
    const template = await this.prisma.calendarTemplate.findFirst({
      where: { id: templateId, householdId },
      include: calendarTemplateInclude,
    });
    return template ? toCalendarTemplateRecord(template) : null;
  }

  public async create(
    input: Parameters<CalendarTemplateRepository['create']>[0],
  ) {
    const id = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.calendarTemplate.create({
        data: {
          householdId: input.householdId,
          createdByUserId: input.userId,
          ...input.template,
          participants: { create: input.template.participants },
        },
        select: { id: true },
      });
      await this.audit.record(transaction, {
        action: 'CALENDAR_TEMPLATE_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarTemplate',
        entityId: created.id,
        metadata: {
          templateId: created.id,
          eventType: input.template.eventType,
        },
      });
      return created.id;
    });
    const created = await this.findById(input.householdId, id);
    if (!created) throw new Error('CALENDAR_TEMPLATE_CREATE_FAILED');
    return created;
  }

  public async update(
    input: Parameters<CalendarTemplateRepository['update']>[0],
  ) {
    const { participants: _participants, ...templateData } = input.template;
    void _participants;
    const changed = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.calendarTemplate.updateMany({
        where: { id: input.templateId, householdId: input.householdId },
        data: templateData,
      });
      if (result.count === 0) return false;
      await transaction.calendarTemplateParticipant.deleteMany({
        where: { templateId: input.templateId },
      });
      if (input.template.participants.length) {
        await transaction.calendarTemplateParticipant.createMany({
          data: input.template.participants.map((participant) => ({
            templateId: input.templateId,
            ...participant,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'CALENDAR_TEMPLATE_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarTemplate',
        entityId: input.templateId,
        metadata: { templateId: input.templateId },
      });
      return true;
    });
    return changed ? this.findById(input.householdId, input.templateId) : null;
  }

  public async delete(
    input: Parameters<CalendarTemplateRepository['delete']>[0],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const template = await transaction.calendarTemplate.findFirst({
        where: { id: input.templateId, householdId: input.householdId },
        select: { id: true },
      });
      if (!template) return false;
      await transaction.calendarTemplate.delete({
        where: { id: input.templateId },
      });
      await this.audit.record(transaction, {
        action: 'CALENDAR_TEMPLATE_DELETED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarTemplate',
        entityId: input.templateId,
        metadata: { templateId: input.templateId },
      });
      return true;
    });
  }

  public async apply(
    input: Parameters<CalendarTemplateRepository['apply']>[0],
  ) {
    const result = await this.prisma.$transaction(async (transaction) => {
      const batch = await transaction.calendarTemplateApplicationBatch.create({
        data: {
          householdId: input.householdId,
          templateId: input.templateId,
          createdByUserId: input.userId,
          eventCount: input.events.length,
        },
      });
      const ids: string[] = [];
      for (const event of input.events) {
        const created = await transaction.calendarEvent.create({
          data: {
            householdId: input.householdId,
            createdByUserId: input.userId,
            updatedByUserId: input.userId,
            ...event,
            source: 'TEMPLATE',
            templateId: input.templateId,
            templateApplicationBatchId: batch.id,
            participants: { create: event.participants },
          },
          select: { id: true },
        });
        ids.push(created.id);
      }
      await this.audit.record(transaction, {
        action:
          input.events.length === 1
            ? 'CALENDAR_TEMPLATE_APPLIED'
            : 'CALENDAR_TEMPLATE_BULK_APPLIED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarTemplateApplicationBatch',
        entityId: batch.id,
        metadata: {
          templateId: input.templateId,
          batchId: batch.id,
          eventCount: input.events.length,
        },
      });
      return { batchId: batch.id, ids };
    });
    const events = await this.prisma.calendarEvent.findMany({
      where: { id: { in: result.ids }, deletedAt: null },
      include: calendarEventInclude,
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
    });
    return {
      batchId: result.batchId,
      events: events.map(toCalendarEventRecord),
    };
  }

  public async revert(
    input: Parameters<CalendarTemplateRepository['revert']>[0],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const batch =
        await transaction.calendarTemplateApplicationBatch.findFirst({
          where: {
            id: input.batchId,
            householdId: input.householdId,
            revertedAt: null,
          },
          select: { id: true, eventCount: true, templateId: true },
        });
      if (!batch) return false;
      const attached = await transaction.calendarEvent.count({
        where: { templateApplicationBatchId: batch.id },
      });
      if (attached !== batch.eventCount) return false;
      const active = await transaction.calendarEvent.findMany({
        where: {
          templateApplicationBatchId: batch.id,
          deletedAt: null,
        },
        select: { id: true },
      });
      const activeIds = active.map(({ id }) => id);
      if (activeIds.length) {
        await transaction.calendarEvent.updateMany({
          where: { id: { in: activeIds } },
          data: {
            deletedAt: input.now,
            deletedByUserId: input.userId,
            updatedByUserId: input.userId,
          },
        });
        await transaction.taskCalendarLink.updateMany({
          where: { calendarEventId: { in: activeIds }, removedAt: null },
          data: { removedAt: input.now },
        });
        await transaction.calendarEventTravelPlan.deleteMany({
          where: { eventId: { in: activeIds } },
        });
        await transaction.calendarEventTravelPlan.updateMany({
          where: { previousEventId: { in: activeIds } },
          data: { previousEventId: null, status: 'STALE' },
        });
      }
      await transaction.calendarTemplateApplicationBatch.update({
        where: { id: batch.id },
        data: { revertedAt: input.now },
      });
      await this.audit.record(transaction, {
        action: 'CALENDAR_TEMPLATE_BATCH_REVERTED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'CalendarTemplateApplicationBatch',
        entityId: batch.id,
        metadata: {
          batchId: batch.id,
          templateId: batch.templateId,
          eventCount: activeIds.length,
        },
      });
      return true;
    });
  }
}
