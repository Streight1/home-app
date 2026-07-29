import { ForbiddenException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { calculateNextDateOccurrence } from '../src/common/recurrence/date-recurrence.js';
import { MaintenancePlansService } from '../src/modules/maintenance/application/maintenance-plans.service.js';
import { MaintenanceProgressionService } from '../src/modules/maintenance/application/maintenance-progression.service.js';
import { MaintenanceRecurrenceService } from '../src/modules/maintenance/application/maintenance-recurrence.service.js';
import { MaintenanceGenerationWorker } from '../src/modules/maintenance/application/maintenance-generation.worker.js';
import { MaintenanceTaskService } from '../src/modules/maintenance/application/maintenance-task.service.js';
import { MaintenanceValidationService } from '../src/modules/maintenance/application/maintenance-validation.service.js';
import type { MaintenanceResponseMapper } from '../src/modules/maintenance/application/maintenance-response.mapper.js';
import type { PrismaMaintenanceCategoryRepository } from '../src/modules/maintenance/infrastructure/prisma-maintenance-category.repository.js';
import type { PrismaMaintenanceLinkRepository } from '../src/modules/maintenance/infrastructure/prisma-maintenance-link.repository.js';
import { PrismaMaintenanceOccurrenceRepository } from '../src/modules/maintenance/infrastructure/prisma-maintenance-occurrence.repository.js';
import type { PrismaMaintenancePlanRepository } from '../src/modules/maintenance/infrastructure/prisma-maintenance-plan.repository.js';
import type { PrismaMaintenancePlanWriter } from '../src/modules/maintenance/infrastructure/prisma-maintenance-plan.writer.js';
import type { DocumentsFacade } from '../src/modules/documents/documents.facade.js';
import type { FinanceLedgerFacade } from '../src/modules/finance/finance-ledger.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import type { TasksFacade } from '../src/modules/tasks/tasks.facade.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import { MaintenanceFacade } from '../src/modules/maintenance/maintenance.facade.js';

const recurrence = new MaintenanceRecurrenceService();

describe('maintenance recurrence', () => {
  it('creates one occurrence for a one-time plan', () => {
    expect(
      recurrence.planningWindow({
        startsOn: '2026-08-15',
        today: '2026-07-29',
        endsOn: null,
        recurrence: { frequency: 'ONCE', interval: 1 },
        recurrenceBasis: 'FROM_SCHEDULED_DATE',
      }),
    ).toEqual(['2026-08-15']);
  });

  it('calculates every three months and retains only a bounded window', () => {
    expect(
      recurrence.planningWindow({
        startsOn: '2025-01-15',
        today: '2026-07-29',
        endsOn: null,
        recurrence: {
          frequency: 'MONTHLY',
          interval: 3,
          dayOfMonth: 15,
        },
        recurrenceBasis: 'FROM_SCHEDULED_DATE',
      }),
    ).toEqual(['2026-07-15', '2026-10-15']);
  });

  it('supports annual, fortnightly and first-Saturday schedules', () => {
    expect(
      calculateNextDateOccurrence({
        currentDate: '2026-10-01',
        anchorDate: '2026-10-01',
        definition: {
          frequency: 'YEARLY',
          interval: 1,
          monthOfYear: 10,
          dayOfMonth: 1,
        },
      }),
    ).toBe('2027-10-01');
    expect(
      calculateNextDateOccurrence({
        currentDate: '2026-07-29',
        anchorDate: '2026-07-29',
        definition: { frequency: 'DAILY', interval: 14 },
      }),
    ).toBe('2026-08-12');
    expect(
      calculateNextDateOccurrence({
        currentDate: '2026-04-01',
        anchorDate: '2026-04-01',
        definition: {
          frequency: 'YEARLY',
          interval: 1,
          monthOfYear: 4,
          ordinal: 1,
          weekday: 6,
        },
      }),
    ).toBe('2026-04-04');
  });

  it('supports a monthly day 31 and selected months without an instant', () => {
    expect(
      calculateNextDateOccurrence({
        currentDate: '2026-01-31',
        anchorDate: '2026-01-31',
        definition: {
          frequency: 'MONTHLY',
          interval: 1,
          dayOfMonth: 31,
        },
      }),
    ).toBe('2026-02-28');
    expect(
      calculateNextDateOccurrence({
        currentDate: '2026-04-04',
        anchorDate: '2026-04-04',
        definition: {
          frequency: 'CUSTOM_MONTHS',
          interval: 1,
          months: [4, 10],
          ordinal: 1,
          weekday: 6,
        },
      }),
    ).toBe('2026-10-03');
  });

  it('uses completion date as a new anchor when requested by the caller', () => {
    expect(
      recurrence.next({
        currentDate: '2026-04-10',
        startsOn: '2026-04-10',
        endsOn: null,
        recurrence: {
          frequency: 'MONTHLY',
          interval: 3,
          dayOfMonth: 10,
        },
      }),
    ).toBe('2026-07-10');
    expect(
      recurrence.next({
        currentDate: '2026-04-01',
        startsOn: '2026-01-01',
        endsOn: null,
        recurrence: {
          frequency: 'MONTHLY',
          interval: 3,
          dayOfMonth: 1,
        },
      }),
    ).toBe('2026-07-01');
  });

  it('validates interval selectors and end dates', () => {
    expect(() =>
      recurrence.validate({ frequency: 'WEEKLY', interval: 1 }, '2026-07-29'),
    ).toThrow(expect.objectContaining({ code: 'MAINTENANCE_INVALID' }));
    expect(() =>
      recurrence.validate(
        { frequency: 'ONCE', interval: 1 },
        '2026-07-29',
        '2026-07-28',
      ),
    ).toThrow(expect.objectContaining({ code: 'MAINTENANCE_INVALID' }));
  });
});

describe('maintenance public module boundaries', () => {
  it('advances scheduled and completion-based plans from the correct anchor', async () => {
    const plans = {
      generate: vi.fn().mockResolvedValue(1),
      refreshNextDueForPlan: vi.fn().mockResolvedValue('2026-07-01'),
      completeWhenNoPending: vi.fn(),
    } as unknown as PrismaMaintenancePlanRepository;
    const progression = new MaintenanceProgressionService(plans, recurrence);
    const occurrence = {
      maintenancePlanId: 'plan-a',
      originalScheduledFor: new Date('2026-04-01T00:00:00.000Z'),
      maintenancePlan: {
        recurrenceBasis: 'FROM_SCHEDULED_DATE',
        recurrenceDefinition: {
          frequency: 'MONTHLY',
          interval: 3,
          dayOfMonth: 1,
        },
        startsOn: new Date('2026-01-01T00:00:00.000Z'),
        endsOn: null,
      },
    };
    await progression.advance(
      'member-a',
      'household-a',
      occurrence as never,
      null,
      '2026-04-10',
    );
    expect(plans.generate).toHaveBeenLastCalledWith(
      'household-a',
      'member-a',
      'plan-a',
      ['2026-07-01'],
    );
    occurrence.maintenancePlan.recurrenceBasis = 'FROM_COMPLETION_DATE';
    occurrence.maintenancePlan.recurrenceDefinition.dayOfMonth = 10;
    await progression.advance(
      'member-a',
      'household-a',
      occurrence as never,
      null,
      '2026-04-10',
    );
    expect(plans.generate).toHaveBeenLastCalledWith(
      'household-a',
      'member-a',
      'plan-a',
      ['2026-07-10'],
    );
  });

  it('runs bounded background generation with an active household actor', async () => {
    const plans = {
      generationCandidates: vi.fn().mockResolvedValue([
        {
          id: 'plan-a',
          household: { members: [{ userId: 'member-a' }] },
        },
        { id: 'plan-without-actor', household: { members: [] } },
      ]),
    } as unknown as PrismaMaintenancePlanRepository;
    const planService = {
      generateForPlan: vi.fn().mockResolvedValue({ createdCount: 1 }),
    } as unknown as MaintenancePlansService;
    const worker = new MaintenanceGenerationWorker(plans, planService);
    await expect(worker.execute()).resolves.toEqual({ processedCount: 1 });
    expect(planService.generateForPlan).toHaveBeenCalledOnce();
    expect(planService.generateForPlan).toHaveBeenCalledWith(
      'member-a',
      'plan-a',
    );
  });

  it('requires MEMBER access before creating a plan', async () => {
    const access = {
      getActiveMembership: vi.fn().mockRejectedValue(new ForbiddenException()),
    } as unknown as HouseholdAccessService;
    const service = new MaintenancePlansService(
      access,
      {} as PrismaMaintenancePlanRepository,
      {} as PrismaMaintenancePlanWriter,
      recurrence,
      {} as MaintenanceValidationService,
      {} as MaintenanceResponseMapper,
      {} as MaintenanceTaskService,
      { now: () => new Date('2026-07-29T08:00:00.000Z') },
    );
    await expect(
      service.create('viewer', {
        title: 'Revize kotle',
        recurrence: { frequency: 'ONCE', interval: 1 },
        startsOn: '2026-08-15',
        priority: 'NORMAL',
        recurrenceBasis: 'FROM_SCHEDULED_DATE',
        leadDays: 7,
        autoCreateTask: false,
        taskCreateDaysBefore: 7,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(access.getActiveMembership).toHaveBeenCalledWith('viewer', 'MEMBER');
  });

  it('lets a MEMBER create a plan and validates references first', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const plans = {
      find: vi.fn().mockResolvedValue({ occurrences: [] }),
    } as unknown as PrismaMaintenancePlanRepository;
    const planWriter = {
      create: vi.fn().mockResolvedValue('plan-a'),
    } as unknown as PrismaMaintenancePlanWriter;
    const validation = {
      planReferences: vi.fn().mockResolvedValue(undefined),
    } as unknown as MaintenanceValidationService;
    const responses = {
      plan: vi.fn().mockReturnValue({ id: 'plan-a' }),
    } as unknown as MaintenanceResponseMapper;
    const service = new MaintenancePlansService(
      access,
      plans,
      planWriter,
      recurrence,
      validation,
      responses,
      {} as MaintenanceTaskService,
      { now: () => new Date('2026-07-29T08:00:00.000Z') },
    );
    await expect(
      service.create('member-a', {
        title: 'Kontrola záloh',
        recurrence: { frequency: 'ONCE', interval: 1 },
        startsOn: '2026-08-15',
        priority: 'NORMAL',
        recurrenceBasis: 'FROM_SCHEDULED_DATE',
        leadDays: 7,
        autoCreateTask: false,
        taskCreateDaysBefore: 7,
      }),
    ).resolves.toMatchObject({ id: 'plan-a' });
    expect(
      vi.mocked(validation.planReferences).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(planWriter.create).mock.invocationCallOrder[0] ?? Infinity,
    );
  });

  it('rejects a category from another household and validates assignees', async () => {
    const access = {
      assertActiveMembers: vi.fn().mockResolvedValue(undefined),
    } as unknown as HouseholdAccessService;
    const categories = {
      find: vi.fn().mockResolvedValue(null),
    } as unknown as PrismaMaintenanceCategoryRepository;
    const validation = new MaintenanceValidationService(
      access,
      categories,
      {} as DocumentsFacade,
      {} as FinanceLedgerFacade,
    );
    await expect(
      validation.planReferences('household-a', {
        categoryId: 'category-from-household-b',
      }),
    ).rejects.toMatchObject({ code: 'MAINTENANCE_NOT_FOUND' });
    vi.mocked(categories.find).mockResolvedValue({
      id: 'category-a',
      archivedAt: null,
    } as never);
    await validation.planReferences('household-a', {
      categoryId: 'category-a',
      responsibleUserId: 'member-a',
    });
    expect(access.assertActiveMembers).toHaveBeenCalledWith('household-a', [
      'member-a',
    ]);
  });

  it('validates documents and finance links through public facades', async () => {
    const documents = {
      verifyAccessibleSummaries: vi.fn().mockResolvedValue([{ id: 'doc-a' }]),
    } as unknown as DocumentsFacade;
    const finance = {
      verifyAccessibleTransactionSummaries: vi
        .fn()
        .mockResolvedValue([{ id: 'transaction-a' }]),
    } as unknown as FinanceLedgerFacade;
    const validation = new MaintenanceValidationService(
      {} as HouseholdAccessService,
      {} as PrismaMaintenanceCategoryRepository,
      documents,
      finance,
    );
    await expect(validation.documentIds('user-a', ['doc-a'])).resolves.toEqual([
      { id: 'doc-a' },
    ]);
    await expect(
      validation.transactionIds('user-a', ['transaction-a']),
    ).resolves.toEqual([{ id: 'transaction-a' }]);
    expect(documents.verifyAccessibleSummaries).toHaveBeenCalledWith('user-a', [
      'doc-a',
    ]);
    expect(finance.verifyAccessibleTransactionSummaries).toHaveBeenCalledWith(
      'user-a',
      ['transaction-a'],
    );
  });

  it('maps a linked task to a safe household-scoped maintenance context', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const links = {
      findTaskContext: vi.fn().mockResolvedValue({
        maintenanceOccurrence: {
          id: 'occurrence-a',
          status: 'TASK_CREATED',
          scheduledFor: new Date('2026-08-15T00:00:00.000Z'),
          maintenancePlan: {
            id: 'plan-a',
            title: 'Revize kotle',
            status: 'ACTIVE',
          },
        },
      }),
    } as unknown as PrismaMaintenanceLinkRepository;
    const facade = new MaintenanceFacade(
      access,
      {} as PrismaMaintenancePlanRepository,
      {} as PrismaMaintenanceOccurrenceRepository,
      links,
    );
    await expect(
      facade.getTaskContext('member-a', 'task-a'),
    ).resolves.toMatchObject({
      planTitle: 'Revize kotle',
      occurrenceStatus: 'TASK_CREATED',
      permissions: { canComplete: true },
      navigationTarget: { area: 'maintenance', screen: 'plan' },
    });
    expect(links.findTaskContext).toHaveBeenCalledWith('household-a', 'task-a');
  });

  it('requires currency with a minor-unit cost', () => {
    const validation = new MaintenanceValidationService(
      {} as HouseholdAccessService,
      {} as PrismaMaintenanceCategoryRepository,
      {} as DocumentsFacade,
      {} as FinanceLedgerFacade,
    );
    expect(() => validation.money('125000', null)).toThrow(
      expect.objectContaining({ code: 'MAINTENANCE_INVALID' }),
    );
    expect(() => validation.money('125000', 'CZK')).not.toThrow();
  });

  it('creates a linked task only through TasksFacade', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const occurrences = {
      find: vi.fn().mockResolvedValue({
        id: 'occurrence-a',
        status: 'SCHEDULED',
        taskId: null,
        scheduledFor: new Date('2026-08-15T00:00:00.000Z'),
        maintenancePlan: {
          title: 'Revize kotle',
          status: 'ACTIVE',
          priority: 'HIGH',
          responsibleUserId: 'member-a',
          preferredStartTime: null,
          estimatedDurationMinutes: 60,
          locationLabel: 'Technická místnost',
        },
      }),
      linkTask: vi.fn().mockResolvedValue(true),
    } as unknown as PrismaMaintenanceOccurrenceRepository;
    const tasks = {
      createForMaintenance: vi.fn().mockResolvedValue({ id: 'task-a' }),
    } as unknown as TasksFacade;
    const service = new MaintenanceTaskService(
      access,
      occurrences,
      {} as PrismaMaintenancePlanRepository,
      tasks,
      { now: () => new Date('2026-07-29T08:00:00.000Z') },
    );
    await expect(service.create('user-a', 'occurrence-a')).resolves.toEqual({
      taskId: 'task-a',
      created: true,
    });
    expect(tasks.createForMaintenance).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-a',
        title: 'Revize kotle',
        dueDate: '2026-08-15',
      }),
    );
  });

  it('does not create a second task for an already linked occurrence', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const occurrences = {
      find: vi
        .fn()
        .mockResolvedValue({ taskId: 'task-a', status: 'TASK_CREATED' }),
    } as unknown as PrismaMaintenanceOccurrenceRepository;
    const tasks = {
      createForMaintenance: vi.fn(),
    } as unknown as TasksFacade;
    const service = new MaintenanceTaskService(
      access,
      occurrences,
      {} as PrismaMaintenancePlanRepository,
      tasks,
      { now: () => new Date('2026-07-29T08:00:00.000Z') },
    );
    await expect(service.create('member-a', 'occurrence-a')).resolves.toEqual({
      taskId: 'task-a',
      created: false,
    });
    expect(tasks.createForMaintenance).not.toHaveBeenCalled();
  });

  it('does not generate occurrences while a plan is paused', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const plans = {
      find: vi.fn().mockResolvedValue({ status: 'PAUSED' }),
      generate: vi.fn(),
    } as unknown as PrismaMaintenancePlanRepository;
    const service = new MaintenancePlansService(
      access,
      plans,
      {} as PrismaMaintenancePlanWriter,
      recurrence,
      {} as MaintenanceValidationService,
      {} as MaintenanceResponseMapper,
      {} as MaintenanceTaskService,
      { now: () => new Date('2026-07-29T08:00:00.000Z') },
    );
    await expect(
      service.generateForPlan('member-a', 'plan-a'),
    ).resolves.toEqual({ createdCount: 0 });
    expect(plans.generate).not.toHaveBeenCalled();
  });

  it('commits linked work inside the occurrence transaction and audits no private values', async () => {
    const beforeCommit = vi.fn();
    const transaction = {
      maintenanceOccurrence: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi.fn().mockResolvedValue({ maintenancePlanId: 'plan-a' }),
        findFirst: vi.fn().mockResolvedValue({
          scheduledFor: new Date('2026-11-15T00:00:00.000Z'),
        }),
        createManyAndReturn: vi.fn().mockResolvedValue([
          {
            id: 'next-occurrence',
          },
        ]),
      },
      maintenancePlan: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      maintenanceOccurrenceDocument: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      maintenanceOccurrenceTransaction: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: vi
        .fn()
        .mockImplementation(
          (callback: (value: typeof transaction) => unknown) =>
            callback(transaction),
        ),
    } as unknown as PrismaService;
    const audit = {
      record: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;
    const repository = new PrismaMaintenanceOccurrenceRepository(prisma, audit);
    await expect(
      repository.complete({
        householdId: 'household-a',
        userId: 'member-a',
        occurrenceId: 'occurrence-a',
        completedOn: '2026-08-15',
        completedByUserId: 'member-a',
        completedAt: new Date('2026-08-15T08:00:00.000Z'),
        notes: 'Soukromá servisní poznámka',
        providerName: 'Servis',
        actualCostMinor: '125000',
        currencyCode: 'CZK',
        documentIds: ['document-a'],
        transactionIds: ['transaction-a'],
        nextOccurrenceDate: '2026-11-15',
        beforeCommit,
      }),
    ).resolves.toBe(true);
    expect(beforeCommit).toHaveBeenCalledWith(transaction);
    expect(
      transaction.maintenanceOccurrence.createManyAndReturn,
    ).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
    expect(transaction.maintenancePlan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          nextDueOn: new Date('2026-11-15T00:00:00.000Z'),
        },
      }),
    );
    const auditPayload = vi.mocked(audit.record).mock.calls[0]?.[1];
    expect(JSON.stringify(auditPayload)).not.toContain('Soukromá');
    expect(JSON.stringify(auditPayload)).not.toContain('125000');
  });

  it('ships database uniqueness and lookup indexes for idempotent generation', () => {
    const migration = readFileSync(
      'prisma/migrations/20260729120000_household_maintenance/migration.sql',
      'utf8',
    );
    expect(migration).toContain(
      'MaintenanceOccurrence_maintenancePlanId_originalScheduledFor_key',
    );
    expect(migration).toContain(
      'MaintenanceOccurrence_householdId_status_scheduledFor_idx',
    );
    expect(migration).toContain('MaintenanceTaskLink_active_occurrence_key');
  });
});
