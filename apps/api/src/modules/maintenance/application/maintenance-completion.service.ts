import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { TasksFacade } from '../../tasks/tasks.facade.js';
import {
  MAINTENANCE_CLOCK,
  type MaintenanceClock,
} from '../domain/maintenance-clock.port.js';
import {
  maintenanceConflict,
  maintenanceInvalid,
  maintenanceNotFound,
} from '../domain/maintenance.errors.js';
import { MAINTENANCE_WRITE_ROLE } from '../domain/maintenance.types.js';
import { PrismaMaintenanceOccurrenceRepository } from '../infrastructure/prisma-maintenance-occurrence.repository.js';
import type { CompleteMaintenanceOccurrenceDto } from '../presentation/dto/maintenance.dto.js';
import { MaintenanceOccurrencesService } from './maintenance-occurrences.service.js';
import { MaintenanceProgressionService } from './maintenance-progression.service.js';
import { MaintenanceValidationService } from './maintenance-validation.service.js';

@Injectable()
export class MaintenanceCompletionService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly occurrences: PrismaMaintenanceOccurrenceRepository,
    private readonly occurrenceResponses: MaintenanceOccurrencesService,
    private readonly progression: MaintenanceProgressionService,
    private readonly validation: MaintenanceValidationService,
    private readonly tasks: TasksFacade,
    @Inject(MAINTENANCE_CLOCK) private readonly clock: MaintenanceClock,
  ) {}

  public async complete(
    userId: string,
    occurrenceId: string,
    input: CompleteMaintenanceOccurrenceDto,
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
    if (!['SCHEDULED', 'TASK_CREATED'].includes(occurrence.status))
      throw maintenanceConflict('Tento výskyt již nelze dokončit.');
    const completedByUserId = input.completedByUserId ?? userId;
    await this.access.assertActiveMembers(membership.householdId, [
      completedByUserId,
    ]);
    this.validation.money(input.actualCostMinor, input.currencyCode);
    if (input.nextDueOn && input.nextDueOn < input.completedOn)
      throw maintenanceInvalid('Další termín nesmí být před dokončením.');
    await Promise.all([
      this.validation.documentIds(userId, input.documentIds),
      this.validation.transactionIds(userId, input.transactionIds),
    ]);
    const completedAt = this.clock.now();
    const linkedTaskId = occurrence.taskId;
    const nextOccurrenceDate = this.progression.nextDate(
      occurrence,
      input.nextDueOn ?? null,
      input.completedOn,
    );
    if (
      !(await this.occurrences.complete({
        householdId: membership.householdId,
        userId,
        occurrenceId,
        completedOn: input.completedOn,
        completedByUserId,
        completedAt,
        notes: input.notes ?? null,
        providerName:
          input.providerName ?? occurrence.maintenancePlan.providerName,
        actualCostMinor: input.actualCostMinor ?? null,
        currencyCode: input.currencyCode ?? null,
        documentIds: input.documentIds,
        transactionIds: input.transactionIds,
        nextOccurrenceDate,
        ...(linkedTaskId
          ? {
              beforeCommit: (transaction) =>
                this.tasks.completeForMaintenanceInTransaction(
                  userId,
                  linkedTaskId,
                  completedAt,
                  transaction,
                ),
            }
          : {}),
      }))
    )
      throw maintenanceConflict('Tento výskyt již nelze dokončit.');
    return this.occurrenceResponses.detail(userId, occurrenceId);
  }
}
