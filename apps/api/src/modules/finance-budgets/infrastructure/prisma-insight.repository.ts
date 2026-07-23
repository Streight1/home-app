import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  SpendingInsightSeverity,
  SpendingInsightType,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';

export interface InsightDraft {
  type: SpendingInsightType;
  currencyCode: string;
  periodStart: Date;
  periodEnd: Date;
  severity: SpendingInsightSeverity;
  title: string;
  explanation: string;
  evidenceJson: Prisma.InputJsonValue;
  evidenceHash: string;
}

@Injectable()
export class PrismaInsightRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public list(
    householdId: string,
    filters: { status?: string; currencyCode?: string },
  ) {
    return this.prisma.spendingInsight.findMany({
      where: {
        householdId,
        ...(filters.status
          ? {
              status: filters.status as
                | 'NEW'
                | 'ACKNOWLEDGED'
                | 'DISMISSED'
                | 'RESOLVED',
            }
          : { status: { in: ['NEW', 'ACKNOWLEDGED'] } }),
        ...(filters.currencyCode ? { currencyCode: filters.currencyCode } : {}),
      },
      orderBy: [{ severity: 'desc' }, { lastDetectedAt: 'desc' }],
      take: 100,
    });
  }

  public async upsertMany(
    householdId: string,
    drafts: readonly InsightDraft[],
  ) {
    for (const draft of drafts) {
      const existing = await this.prisma.spendingInsight.findUnique({
        where: {
          householdId_evidenceHash: {
            householdId,
            evidenceHash: draft.evidenceHash,
          },
        },
        select: { id: true, status: true },
      });
      if (existing?.status === 'DISMISSED') continue;
      await this.prisma.spendingInsight.upsert({
        where: {
          householdId_evidenceHash: {
            householdId,
            evidenceHash: draft.evidenceHash,
          },
        },
        create: { householdId, ...draft },
        update: {
          severity: draft.severity,
          title: draft.title,
          explanation: draft.explanation,
          evidenceJson: draft.evidenceJson,
          lastDetectedAt: new Date(),
          ...(existing?.status === 'RESOLVED'
            ? { status: 'NEW', acknowledgedAt: null }
            : {}),
        },
      });
    }
    return drafts.length;
  }

  public async setStatus(
    householdId: string,
    userId: string,
    insightId: string,
    status: 'ACKNOWLEDGED' | 'DISMISSED',
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.spendingInsight.updateMany({
        where: { id: insightId, householdId },
        data:
          status === 'ACKNOWLEDGED'
            ? { status, acknowledgedAt: new Date(), dismissedAt: null }
            : { status, dismissedAt: new Date() },
      });
      if (!result.count) return false;
      const insight = await transaction.spendingInsight.findUniqueOrThrow({
        where: { id: insightId },
        select: { type: true },
      });
      await this.audit.record(transaction, {
        action:
          status === 'ACKNOWLEDGED'
            ? 'SPENDING_INSIGHT_ACKNOWLEDGED'
            : 'SPENDING_INSIGHT_DISMISSED',
        householdId,
        userId,
        entityType: 'SpendingInsight',
        entityId: insightId,
        metadata: { insightId, insightType: insight.type },
      });
      return true;
    });
  }
}
