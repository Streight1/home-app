import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import {
  addIsoDateDays,
  getZonedParts,
} from '../../../common/time/zoned-date.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  MAINTENANCE_ADMIN_ROLE,
  MAINTENANCE_READ_ROLE,
  MAINTENANCE_WRITE_ROLE,
  maintenanceDateString,
} from '../domain/maintenance.types.js';
import {
  maintenanceConflict,
  maintenanceNotFound,
} from '../domain/maintenance.errors.js';
import {
  MAINTENANCE_CLOCK,
  type MaintenanceClock,
} from '../domain/maintenance-clock.port.js';
import { PrismaMaintenancePlanRepository } from '../infrastructure/prisma-maintenance-plan.repository.js';
import { PrismaMaintenancePlanWriter } from '../infrastructure/prisma-maintenance-plan.writer.js';
import type {
  CreateMaintenancePlanDto,
  ListMaintenancePlansQueryDto,
  MaintenanceRecurrenceDto,
  UpdateMaintenancePlanDto,
} from '../presentation/dto/maintenance.dto.js';
import { MaintenanceRecurrenceService } from './maintenance-recurrence.service.js';
import { MaintenanceResponseMapper } from './maintenance-response.mapper.js';
import { MaintenanceValidationService } from './maintenance-validation.service.js';
import { MaintenanceTaskService } from './maintenance-task.service.js';

@Injectable()
export class MaintenancePlansService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly plans: PrismaMaintenancePlanRepository,
    private readonly planWriter: PrismaMaintenancePlanWriter,
    private readonly recurrence: MaintenanceRecurrenceService,
    private readonly validation: MaintenanceValidationService,
    private readonly responses: MaintenanceResponseMapper,
    private readonly maintenanceTasks: MaintenanceTaskService,
    @Inject(MAINTENANCE_CLOCK) private readonly clock: MaintenanceClock,
  ) {}

  public async list(userId: string, query: ListMaintenancePlansQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_READ_ROLE,
    );
    const today = this.today();
    const result = await this.plans.list(membership.householdId, query, today);
    return {
      items: result.items.map((plan) =>
        this.responses.plan(plan, membership.role, today),
      ),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.pageSize),
      },
    };
  }

  public async detail(userId: string, planId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_READ_ROLE,
    );
    const plan = await this.plans.find(membership.householdId, planId);
    if (!plan) throw maintenanceNotFound();
    return {
      ...this.responses.plan(plan, membership.role, this.today()),
      occurrences: plan.occurrences.map((occurrence) => ({
        id: occurrence.id,
        scheduledFor: maintenanceDateString(occurrence.scheduledFor),
        originalScheduledFor: maintenanceDateString(
          occurrence.originalScheduledFor,
        ),
        status: occurrence.status,
        taskId: occurrence.taskId,
        completedOn: maintenanceDateString(occurrence.completedOn),
        completedAt: occurrence.completedAt?.toISOString() ?? null,
        completionNotes: occurrence.completionNotes,
        skipReason: occurrence.skipReason,
        documentIds: occurrence.documents.map((item) => item.documentId),
        transactionIds: occurrence.transactions.map(
          (item) => item.transactionId,
        ),
      })),
    };
  }

  public async create(userId: string, input: CreateMaintenancePlanDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    await this.validation.planReferences(membership.householdId, input);
    const recurrence = this.recurrence.validate(
      input.recurrence,
      input.startsOn,
      input.endsOn,
    );
    const occurrenceDates = this.recurrence.planningWindow({
      startsOn: input.startsOn,
      today: this.today(),
      endsOn: input.endsOn ?? null,
      recurrence,
      recurrenceBasis: input.recurrenceBasis,
    });
    const planId = await this.planWriter.create({
      householdId: membership.householdId,
      userId,
      plan: input,
      recurrenceDefinition: recurrence as unknown as Prisma.InputJsonValue,
      occurrenceDates,
    });
    if (input.autoCreateTask)
      await this.maintenanceTasks.createDueForPlan(userId, planId);
    return this.detail(userId, planId);
  }

  public async update(
    userId: string,
    planId: string,
    input: UpdateMaintenancePlanDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    const current = await this.plans.find(membership.householdId, planId);
    if (!current) throw maintenanceNotFound();
    if (current.status === 'ARCHIVED')
      throw maintenanceConflict('Archivovaný plán nelze upravovat.');
    const references = {
      categoryId:
        input.categoryId !== undefined ? input.categoryId : current.categoryId,
      responsibleUserId:
        input.responsibleUserId !== undefined
          ? input.responsibleUserId
          : current.responsibleUserId,
      defaultCurrencyCode:
        input.defaultCurrencyCode !== undefined
          ? input.defaultCurrencyCode
          : current.defaultCurrencyCode,
      ...(input.defaultCostMinor !== undefined
        ? { defaultCostMinor: input.defaultCostMinor }
        : current.defaultCostMinor !== null
          ? { defaultCostMinor: current.defaultCostMinor.toString() }
          : {}),
    };
    await this.validation.planReferences(membership.householdId, references);
    const startsOn =
      input.startsOn ?? maintenanceDateString(current.startsOn) ?? this.today();
    const endsOn =
      input.endsOn !== undefined
        ? input.endsOn
        : maintenanceDateString(current.endsOn);
    const recurrenceInput =
      input.recurrence ??
      (current.recurrenceDefinition as unknown as MaintenanceRecurrenceDto);
    const recurrence = this.recurrence.validate(
      recurrenceInput,
      startsOn,
      endsOn,
    );
    const updated = await this.planWriter.update({
      householdId: membership.householdId,
      userId,
      planId,
      plan: input,
      ...(input.recurrence
        ? {
            recurrenceDefinition:
              recurrence as unknown as Prisma.InputJsonValue,
          }
        : {}),
    });
    if (!updated) throw maintenanceNotFound();
    return this.detail(userId, planId);
  }

  public async transition(
    userId: string,
    planId: string,
    action: 'pause' | 'resume' | 'archive' | 'restore',
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      action === 'archive' || action === 'restore'
        ? MAINTENANCE_ADMIN_ROLE
        : MAINTENANCE_WRITE_ROLE,
    );
    const current = await this.plans.find(membership.householdId, planId);
    if (!current) throw maintenanceNotFound();
    const transition = transitionMap[action];
    if (
      action === 'resume' &&
      current.status !== 'PAUSED' &&
      current.status !== 'COMPLETED'
    )
      throw maintenanceConflict('Obnovit lze jen pozastavený plán.');
    if (action === 'restore' && current.status !== 'ARCHIVED')
      throw maintenanceConflict('Obnovit lze jen archivovaný plán.');
    if (
      !(await this.planWriter.transition({
        householdId: membership.householdId,
        userId,
        planId,
        status: transition.status,
        action: transition.audit,
        now: this.clock.now(),
      }))
    )
      throw maintenanceNotFound();
    if (action === 'resume' || action === 'restore')
      await this.generateForPlan(userId, planId);
    return this.detail(userId, planId);
  }

  public async generateForPlan(userId: string, planId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    const plan = await this.plans.find(membership.householdId, planId);
    if (!plan) throw maintenanceNotFound();
    if (plan.status !== 'ACTIVE') return { createdCount: 0 };
    const recurrence =
      plan.recurrenceDefinition as unknown as MaintenanceRecurrenceDto;
    const dates = this.recurrence.planningWindow({
      startsOn: maintenanceDateString(plan.startsOn) ?? this.today(),
      today: this.today(),
      endsOn: maintenanceDateString(plan.endsOn),
      recurrence: this.recurrence.validate(
        recurrence,
        maintenanceDateString(plan.startsOn) ?? this.today(),
        maintenanceDateString(plan.endsOn),
      ),
      recurrenceBasis: plan.recurrenceBasis,
    });
    const createdCount = await this.plans.generate(
      membership.householdId,
      userId,
      planId,
      dates,
    );
    await this.maintenanceTasks.createDueForPlan(userId, planId);
    return { createdCount };
  }

  public today(): string {
    const parts = getZonedParts(this.clock.now(), 'Europe/Prague');
    return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }

  public rangeDates() {
    const today = this.today();
    return {
      today,
      inSevenDays: addIsoDateDays(today, 7),
      inThirtyDays: addIsoDateDays(today, 30),
    };
  }
}

const transitionMap = {
  pause: {
    status: 'PAUSED',
    audit: 'MAINTENANCE_PLAN_PAUSED',
  },
  resume: {
    status: 'ACTIVE',
    audit: 'MAINTENANCE_PLAN_RESUMED',
  },
  archive: {
    status: 'ARCHIVED',
    audit: 'MAINTENANCE_PLAN_ARCHIVED',
  },
  restore: {
    status: 'ACTIVE',
    audit: 'MAINTENANCE_PLAN_RESTORED',
  },
} as const;
