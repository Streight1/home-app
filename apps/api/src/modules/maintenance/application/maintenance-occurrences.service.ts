import { Inject, Injectable } from '@nestjs/common';
import { DocumentsFacade } from '../../documents/documents.facade.js';
import { FinanceLedgerFacade } from '../../finance/finance-ledger.facade.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { TasksFacade } from '../../tasks/tasks.facade.js';
import {
  MAINTENANCE_CLOCK,
  type MaintenanceClock,
} from '../domain/maintenance-clock.port.js';
import {
  maintenanceConflict,
  maintenanceNotFound,
} from '../domain/maintenance.errors.js';
import {
  MAINTENANCE_READ_ROLE,
  MAINTENANCE_WRITE_ROLE,
  maintenanceDateString,
} from '../domain/maintenance.types.js';
import { PrismaMaintenanceLinkRepository } from '../infrastructure/prisma-maintenance-link.repository.js';
import { PrismaMaintenanceOccurrenceRepository } from '../infrastructure/prisma-maintenance-occurrence.repository.js';
import { PrismaMaintenancePlanRepository } from '../infrastructure/prisma-maintenance-plan.repository.js';
import type {
  ListMaintenanceOccurrencesQueryDto,
  RescheduleMaintenanceOccurrenceDto,
  SetMaintenanceDocumentsDto,
  SetMaintenanceTransactionsDto,
  SkipMaintenanceOccurrenceDto,
} from '../presentation/dto/maintenance.dto.js';
import { MaintenanceResponseMapper } from './maintenance-response.mapper.js';
import { MaintenanceProgressionService } from './maintenance-progression.service.js';
import { MaintenanceValidationService } from './maintenance-validation.service.js';

@Injectable()
export class MaintenanceOccurrencesService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly occurrences: PrismaMaintenanceOccurrenceRepository,
    private readonly links: PrismaMaintenanceLinkRepository,
    private readonly plans: PrismaMaintenancePlanRepository,
    private readonly progression: MaintenanceProgressionService,
    private readonly validation: MaintenanceValidationService,
    private readonly responses: MaintenanceResponseMapper,
    private readonly documents: DocumentsFacade,
    private readonly finance: FinanceLedgerFacade,
    private readonly tasks: TasksFacade,
    @Inject(MAINTENANCE_CLOCK) private readonly clock: MaintenanceClock,
  ) {}

  public async list(userId: string, query: ListMaintenanceOccurrencesQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_READ_ROLE,
    );
    const result = await this.occurrences.list(membership.householdId, query);
    const linked = await this.linkedSummaries(userId, result.items);
    return {
      items: result.items.map((item) =>
        this.responses.occurrence(
          item,
          membership.role,
          item.documents
            .map((link) => linked.documents.get(link.documentId))
            .filter((value) => value !== undefined),
          item.transactions
            .map((link) => linked.transactions.get(link.transactionId))
            .filter((value) => value !== undefined),
        ),
      ),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.totalItems,
        totalPages: Math.ceil(result.totalItems / query.pageSize),
      },
    };
  }

  public async detail(userId: string, occurrenceId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_READ_ROLE,
    );
    const occurrence = await this.occurrences.find(
      membership.householdId,
      occurrenceId,
    );
    if (!occurrence) throw maintenanceNotFound();
    const linked = await this.linkedSummaries(userId, [occurrence]);
    return this.responses.occurrence(
      occurrence,
      membership.role,
      occurrence.documents
        .map((link) => linked.documents.get(link.documentId))
        .filter((value) => value !== undefined),
      occurrence.transactions
        .map((link) => linked.transactions.get(link.transactionId))
        .filter((value) => value !== undefined),
    );
  }

  public async skip(
    userId: string,
    occurrenceId: string,
    input: SkipMaintenanceOccurrenceDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    const occurrence = await this.occurrences.find(
      membership.householdId,
      occurrenceId,
    );
    if (!occurrence) throw maintenanceNotFound();
    if (occurrence.taskId)
      await this.tasks.cancelForMaintenance(userId, occurrence.taskId);
    if (
      !(await this.occurrences.skip({
        householdId: membership.householdId,
        userId,
        occurrenceId,
        reason: input.reason ?? null,
        now: this.clock.now(),
      }))
    )
      throw maintenanceConflict('Tento výskyt již nelze přeskočit.');
    await this.progression.advance(
      userId,
      membership.householdId,
      occurrence,
      null,
      maintenanceDateString(occurrence.originalScheduledFor) ?? '',
    );
    return this.detail(userId, occurrenceId);
  }

  public async reschedule(
    userId: string,
    occurrenceId: string,
    input: RescheduleMaintenanceOccurrenceDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    const occurrence = await this.occurrences.find(
      membership.householdId,
      occurrenceId,
    );
    if (!occurrence) throw maintenanceNotFound();
    if (
      !(await this.occurrences.reschedule({
        householdId: membership.householdId,
        userId,
        occurrenceId,
        scheduledFor: input.scheduledFor,
        now: this.clock.now(),
      }))
    )
      throw maintenanceConflict('Tento výskyt již nelze přeplánovat.');
    if (occurrence.taskId)
      await this.tasks.rescheduleForMaintenance(
        userId,
        occurrence.taskId,
        input.scheduledFor,
        occurrence.maintenancePlan.preferredStartTime,
      );
    await this.plans.refreshNextDueForPlan(
      membership.householdId,
      occurrence.maintenancePlanId,
    );
    return this.detail(userId, occurrenceId);
  }

  public async setDocuments(
    userId: string,
    occurrenceId: string,
    input: SetMaintenanceDocumentsDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    await this.validation.documentIds(userId, input.documentIds);
    if (
      !(await this.links.setDocuments({
        householdId: membership.householdId,
        userId,
        occurrenceId,
        documentIds: input.documentIds,
        relationType: input.relationType,
      }))
    )
      throw maintenanceNotFound();
    return this.detail(userId, occurrenceId);
  }

  public async setTransactions(
    userId: string,
    occurrenceId: string,
    input: SetMaintenanceTransactionsDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      MAINTENANCE_WRITE_ROLE,
    );
    await this.validation.transactionIds(userId, input.transactionIds);
    if (
      !(await this.links.setTransactions({
        householdId: membership.householdId,
        userId,
        occurrenceId,
        transactionIds: input.transactionIds,
        relationType: input.relationType,
      }))
    )
      throw maintenanceNotFound();
    return this.detail(userId, occurrenceId);
  }

  private async linkedSummaries(
    userId: string,
    records: readonly {
      documents: readonly { documentId: string }[];
      transactions: readonly { transactionId: string }[];
    }[],
  ) {
    const documentIds = [
      ...new Set(
        records.flatMap((item) =>
          item.documents.map((link) => link.documentId),
        ),
      ),
    ];
    const transactionIds = [
      ...new Set(
        records.flatMap((item) =>
          item.transactions.map((link) => link.transactionId),
        ),
      ),
    ];
    const [documents, transactions] = await Promise.all([
      this.documents.verifyAccessibleSummaries(userId, documentIds),
      this.finance.verifyAccessibleTransactionSummaries(userId, transactionIds),
    ]);
    return {
      documents: new Map(documents.map((item) => [item.id, item])),
      transactions: new Map(transactions.map((item) => [item.id, item])),
    };
  }
}
