import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { invalidBucketList } from '../domain/bucket-list.errors.js';

@Injectable()
export class PrismaBucketListRolloverRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public candidates(householdId: string, sourceListId: string) {
    return this.prisma.bucketListItem.findMany({
      where: {
        householdId,
        bucketListId: sourceListId,
        status: { in: ['PLANNED', 'SKIPPED'] },
        carriedToItem: null,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        documents: {
          include: {
            document: { select: { id: true, title: true, type: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  public carry(input: {
    householdId: string;
    userId: string;
    sourceListId: string;
    sourceYear: number;
    targetYear: number;
    itemIds: readonly string[];
    carryDocuments: boolean;
    carryTargetDate: boolean;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      let target = await transaction.yearlyBucketList.findUnique({
        where: {
          householdId_year: {
            householdId: input.householdId,
            year: input.targetYear,
          },
        },
      });
      if (!target) {
        target = await transaction.yearlyBucketList.create({
          data: {
            householdId: input.householdId,
            year: input.targetYear,
            title: `Bucket list ${String(input.targetYear)}`,
            status: 'ACTIVE',
            createdByUserId: input.userId,
            updatedByUserId: input.userId,
          },
        });
        await this.audit.record(transaction, {
          action: 'BUCKET_LIST_CREATED',
          householdId: input.householdId,
          userId: input.userId,
          entityType: 'YearlyBucketList',
          entityId: target.id,
          metadata: { listId: target.id, year: target.year },
        });
      }
      const sourceItems = await transaction.bucketListItem.findMany({
        where: {
          id: { in: [...new Set(input.itemIds)] },
          householdId: input.householdId,
          bucketListId: input.sourceListId,
          status: { in: ['PLANNED', 'SKIPPED'] },
          carriedToItem: null,
        },
        include: { participants: true, documents: true },
        orderBy: { sortOrder: 'asc' },
      });
      if (sourceItems.length !== new Set(input.itemIds).size)
        throw invalidBucketList(
          'Některé položky se během převodu změnily. Načtěte výběr znovu.',
        );
      const createdIds: string[] = [];
      for (const source of sourceItems) {
        const targetDate =
          input.carryTargetDate && source.targetDate
            ? targetYearDate(source.targetDate, input.targetYear)
            : null;
        const created = await transaction.bucketListItem.create({
          data: {
            householdId: input.householdId,
            bucketListId: target.id,
            title: source.title,
            description: source.description,
            category: source.category,
            priority: source.priority,
            status: 'PLANNED',
            targetDate,
            locationPlaceId: source.locationPlaceId,
            locationLabel: source.locationLabel,
            locationNotes: source.locationNotes,
            notes: source.notes,
            sortOrder: source.sortOrder,
            carriedFromItemId: source.id,
            createdByUserId: input.userId,
            updatedByUserId: input.userId,
            participants: {
              create: source.participants.map((participant) => ({
                userId: participant.userId,
                addedByUserId: input.userId,
              })),
            },
            ...(input.carryDocuments
              ? {
                  documents: {
                    create: source.documents.map((link) => ({
                      documentId: link.documentId,
                      createdByUserId: input.userId,
                    })),
                  },
                }
              : {}),
          },
        });
        createdIds.push(created.id);
      }
      await this.audit.record(transaction, {
        action: 'BUCKET_LIST_ROLLOVER_COMPLETED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'YearlyBucketList',
        entityId: target.id,
        metadata: {
          sourceListId: input.sourceListId,
          targetListId: target.id,
          sourceYear: input.sourceYear,
          targetYear: input.targetYear,
          itemCount: createdIds.length,
        },
      });
      return { targetListId: target.id, createdItemIds: createdIds };
    });
  }
}

function targetYearDate(source: Date, targetYear: number): Date {
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  const lastDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, month, Math.min(day, lastDay)));
}
