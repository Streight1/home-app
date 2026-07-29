import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class PrismaMaintenanceLinkRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public findTaskContext(householdId: string, taskId: string) {
    return this.prisma.maintenanceTaskLink.findFirst({
      where: {
        taskId,
        removedAt: null,
        maintenanceOccurrence: { householdId },
      },
      select: {
        maintenanceOccurrence: {
          select: {
            id: true,
            status: true,
            scheduledFor: true,
            maintenancePlan: {
              select: { id: true, title: true, status: true },
            },
          },
        },
      },
    });
  }

  public setDocuments(input: {
    householdId: string;
    userId: string;
    occurrenceId: string;
    documentIds: readonly string[];
    relationType:
      | 'SERVICE_REPORT'
      | 'INVOICE'
      | 'RECEIPT'
      | 'WARRANTY'
      | 'MANUAL'
      | 'PHOTO'
      | 'OTHER';
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const occurrence = await transaction.maintenanceOccurrence.findFirst({
        where: { id: input.occurrenceId, householdId: input.householdId },
        select: { id: true },
      });
      if (!occurrence) return false;
      await transaction.maintenanceOccurrenceDocument.deleteMany({
        where: { maintenanceOccurrenceId: input.occurrenceId },
      });
      if (input.documentIds.length)
        await transaction.maintenanceOccurrenceDocument.createMany({
          data: input.documentIds.map((documentId) => ({
            maintenanceOccurrenceId: input.occurrenceId,
            documentId,
            relationType: input.relationType,
            createdByUserId: input.userId,
          })),
        });
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_DOCUMENT_LINKED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenanceOccurrence',
        entityId: input.occurrenceId,
        metadata: {
          occurrenceId: input.occurrenceId,
          documentCount: input.documentIds.length,
        },
      });
      return true;
    });
  }

  public setTransactions(input: {
    householdId: string;
    userId: string;
    occurrenceId: string;
    transactionIds: readonly string[];
    relationType: 'SERVICE_COST' | 'MATERIAL' | 'INSPECTION_FEE' | 'OTHER';
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const occurrence = await transaction.maintenanceOccurrence.findFirst({
        where: { id: input.occurrenceId, householdId: input.householdId },
        select: { id: true },
      });
      if (!occurrence) return false;
      await transaction.maintenanceOccurrenceTransaction.deleteMany({
        where: { maintenanceOccurrenceId: input.occurrenceId },
      });
      if (input.transactionIds.length)
        await transaction.maintenanceOccurrenceTransaction.createMany({
          data: input.transactionIds.map((transactionId) => ({
            maintenanceOccurrenceId: input.occurrenceId,
            transactionId,
            relationType: input.relationType,
            createdByUserId: input.userId,
          })),
        });
      await this.audit.record(transaction, {
        action: 'MAINTENANCE_TRANSACTION_LINKED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'MaintenanceOccurrence',
        entityId: input.occurrenceId,
        metadata: {
          occurrenceId: input.occurrenceId,
          transactionCount: input.transactionIds.length,
        },
      });
      return true;
    });
  }
}
