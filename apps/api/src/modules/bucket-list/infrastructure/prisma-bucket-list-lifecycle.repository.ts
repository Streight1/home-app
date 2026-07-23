import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';

@Injectable()
export class PrismaBucketListLifecycleRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public execute(input: {
    householdId: string;
    userId: string;
    itemId: string;
    action: 'complete' | 'reopen' | 'skip' | 'restore';
    at: Date;
    note?: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.bucketListItem.findFirst({
        where: { id: input.itemId, householdId: input.householdId },
      });
      if (!current) return false;
      if (input.action === 'complete' && current.status === 'COMPLETED')
        return true;
      const data =
        input.action === 'complete'
          ? {
              status: 'COMPLETED' as const,
              completedAt: input.at,
              completedByUserId: input.userId,
              skippedAt: null,
              skippedByUserId: null,
              skippedReason: null,
            }
          : input.action === 'skip'
            ? {
                status: 'SKIPPED' as const,
                skippedAt: input.at,
                skippedByUserId: input.userId,
                skippedReason: trimmedOrNull(input.note),
                completedAt: null,
                completedByUserId: null,
              }
            : {
                status: 'PLANNED' as const,
                completedAt: null,
                completedByUserId: null,
                skippedAt: null,
                skippedByUserId: null,
                skippedReason: null,
              };
      await transaction.bucketListItem.update({
        where: { id: input.itemId },
        data: { ...data, updatedByUserId: input.userId },
      });
      if (input.action === 'complete') {
        await transaction.bucketListItemCompletion.create({
          data: {
            bucketListItemId: input.itemId,
            householdId: input.householdId,
            completedByUserId: input.userId,
            completedAt: input.at,
            note: trimmedOrNull(input.note),
          },
        });
      }
      await this.audit.record(transaction, {
        action: actionFor(input.action),
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'BucketListItem',
        entityId: input.itemId,
        metadata: { itemId: input.itemId },
      });
      return true;
    });
  }
}

function trimmedOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

function actionFor(action: 'complete' | 'reopen' | 'skip' | 'restore') {
  return {
    complete: 'BUCKET_LIST_ITEM_COMPLETED',
    reopen: 'BUCKET_LIST_ITEM_REOPENED',
    skip: 'BUCKET_LIST_ITEM_SKIPPED',
    restore: 'BUCKET_LIST_ITEM_RESTORED',
  }[action] as
    | 'BUCKET_LIST_ITEM_COMPLETED'
    | 'BUCKET_LIST_ITEM_REOPENED'
    | 'BUCKET_LIST_ITEM_SKIPPED'
    | 'BUCKET_LIST_ITEM_RESTORED';
}
