import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import { dateOnly } from '../domain/bucket-list.types.js';
import type {
  CreateBucketListItemDto,
  ListBucketListItemsQueryDto,
  UpdateBucketListItemDto,
} from '../presentation/dto/bucket-list.dto.js';

const itemInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          householdMembers: {
            select: { calendarColorToken: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  documents: {
    include: {
      document: {
        select: { id: true, title: true, type: true, status: true },
      },
    },
  },
  completions: {
    include: {
      completedBy: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { completedAt: 'desc' as const },
  },
  carriedFromItem: { select: { id: true, title: true } },
  carriedToItem: { select: { id: true, title: true } },
} as const;

@Injectable()
export class PrismaBucketListItemRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public list(
    householdId: string,
    bucketListId: string,
    query: ListBucketListItemsQueryDto,
  ) {
    const orderBy =
      query.sortBy === 'sortOrder'
        ? [{ sortOrder: query.sortDirection }, { createdAt: 'asc' as const }]
        : [
            {
              [query.sortBy]: {
                sort: query.sortDirection,
                nulls: 'last' as const,
              },
            },
            { createdAt: 'asc' as const },
          ];
    return this.prisma.bucketListItem.findMany({
      where: {
        householdId,
        bucketListId,
        ...(query.status ? { status: query.status } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.participantUserId
          ? { participants: { some: { userId: query.participantUserId } } }
          : {}),
        ...(query.query
          ? {
              OR: [
                { title: { contains: query.query, mode: 'insensitive' } },
                { description: { contains: query.query, mode: 'insensitive' } },
                { notes: { contains: query.query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: itemInclude,
      orderBy,
    });
  }

  public find(householdId: string, itemId: string) {
    return this.prisma.bucketListItem.findFirst({
      where: { id: itemId, householdId },
      include: itemInclude,
    });
  }

  public async create(input: {
    householdId: string;
    userId: string;
    bucketListId: string;
    item: CreateBucketListItemDto;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const item = await transaction.bucketListItem.create({
        data: {
          householdId: input.householdId,
          bucketListId: input.bucketListId,
          ...itemData(input.item),
          title: input.item.title.trim(),
          createdByUserId: input.userId,
          updatedByUserId: input.userId,
          participants: {
            create: input.item.participantUserIds.map((userId) => ({
              userId,
              addedByUserId: input.userId,
            })),
          },
          documents: {
            create: input.item.documentIds.map((documentId) => ({
              documentId,
              createdByUserId: input.userId,
            })),
          },
        },
      });
      await this.audit.record(transaction, {
        action: 'BUCKET_LIST_ITEM_CREATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'BucketListItem',
        entityId: item.id,
        metadata: {
          listId: input.bucketListId,
          itemId: item.id,
          participantCount: input.item.participantUserIds.length,
          documentCount: input.item.documentIds.length,
        },
      });
      return item.id;
    });
  }

  public async update(input: {
    householdId: string;
    userId: string;
    itemId: string;
    item: UpdateBucketListItemDto;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.bucketListItem.updateMany({
        where: { id: input.itemId, householdId: input.householdId },
        data: {
          ...itemData(input.item),
          updatedByUserId: input.userId,
        },
      });
      if (!result.count) return false;
      if (input.item.participantUserIds) {
        await transaction.bucketListItemParticipant.deleteMany({
          where: { bucketListItemId: input.itemId },
        });
        await transaction.bucketListItemParticipant.createMany({
          data: input.item.participantUserIds.map((userId) => ({
            bucketListItemId: input.itemId,
            userId,
            addedByUserId: input.userId,
          })),
        });
      }
      if (input.item.documentIds) {
        await transaction.bucketListItemDocument.deleteMany({
          where: { bucketListItemId: input.itemId },
        });
        await transaction.bucketListItemDocument.createMany({
          data: input.item.documentIds.map((documentId) => ({
            bucketListItemId: input.itemId,
            documentId,
            createdByUserId: input.userId,
          })),
        });
      }
      await this.audit.record(transaction, {
        action: 'BUCKET_LIST_ITEM_UPDATED',
        householdId: input.householdId,
        userId: input.userId,
        entityType: 'BucketListItem',
        entityId: input.itemId,
        metadata: {
          itemId: input.itemId,
          changedFields: Object.keys(input.item),
        },
      });
      return true;
    });
  }

  public async remove(householdId: string, userId: string, itemId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.bucketListItem.findFirst({
        where: { id: itemId, householdId },
        select: { id: true },
      });
      if (!current) return false;
      await transaction.bucketListItemParticipant.deleteMany({
        where: { bucketListItemId: itemId },
      });
      await transaction.bucketListItemDocument.deleteMany({
        where: { bucketListItemId: itemId },
      });
      await transaction.bucketListItemCompletion.deleteMany({
        where: { bucketListItemId: itemId },
      });
      await transaction.bucketListItem.delete({ where: { id: itemId } });
      await this.audit.record(transaction, {
        action: 'BUCKET_LIST_ITEM_DELETED',
        householdId,
        userId,
        entityType: 'BucketListItem',
        entityId: itemId,
        metadata: { itemId },
      });
      return true;
    });
  }
}

export type BucketListItemRecord = NonNullable<
  Awaited<ReturnType<PrismaBucketListItemRepository['find']>>
>;

function itemData(input: UpdateBucketListItemDto | CreateBucketListItemDto) {
  return {
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined
      ? { description: trimmedOrNull(input.description) }
      : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.targetDate !== undefined
      ? { targetDate: input.targetDate ? dateOnly(input.targetDate) : null }
      : {}),
    ...(input.locationPlaceId !== undefined
      ? { locationPlaceId: input.locationPlaceId }
      : {}),
    ...(input.locationLabel !== undefined
      ? { locationLabel: trimmedOrNull(input.locationLabel) }
      : {}),
    ...(input.locationNotes !== undefined
      ? { locationNotes: trimmedOrNull(input.locationNotes) }
      : {}),
    ...(input.notes !== undefined ? { notes: trimmedOrNull(input.notes) } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
  };
}

function trimmedOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}
