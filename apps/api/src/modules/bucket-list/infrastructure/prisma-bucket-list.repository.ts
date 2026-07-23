import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { AuditService } from '../../audit/audit.service.js';
import type {
  CreateBucketListDto,
  UpdateBucketListDto,
} from '../presentation/dto/bucket-list.dto.js';

const listInclude = {
  createdBy: {
    select: { id: true, displayName: true, avatarUrl: true },
  },
  _count: { select: { items: true } },
} as const;

@Injectable()
export class PrismaBucketListRepository {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  public list(householdId: string, query: { year?: number; status?: string }) {
    return this.prisma.yearlyBucketList.findMany({
      where: {
        householdId,
        ...(query.year ? { year: query.year } : {}),
        ...(query.status
          ? {
              status: query.status as
                | 'DRAFT'
                | 'ACTIVE'
                | 'CLOSED'
                | 'ARCHIVED',
            }
          : { status: { not: 'ARCHIVED' as const } }),
      },
      include: listInclude,
      orderBy: { year: 'desc' },
    });
  }

  public find(householdId: string, listId: string) {
    return this.prisma.yearlyBucketList.findFirst({
      where: { id: listId, householdId },
      include: listInclude,
    });
  }

  public findByYear(householdId: string, year: number) {
    return this.prisma.yearlyBucketList.findUnique({
      where: { householdId_year: { householdId, year } },
      include: listInclude,
    });
  }

  public async create(
    householdId: string,
    userId: string,
    input: CreateBucketListDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const list = await transaction.yearlyBucketList.create({
        data: {
          householdId,
          year: input.year,
          title:
            trimmedOrNull(input.title) ?? `Bucket list ${String(input.year)}`,
          description: trimmedOrNull(input.description),
          status: input.status,
          createdByUserId: userId,
          updatedByUserId: userId,
        },
      });
      await this.audit.record(transaction, {
        action: 'BUCKET_LIST_CREATED',
        householdId,
        userId,
        entityType: 'YearlyBucketList',
        entityId: list.id,
        metadata: { listId: list.id, year: list.year },
      });
      return list.id;
    });
  }

  public async update(
    householdId: string,
    userId: string,
    listId: string,
    input: UpdateBucketListDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.yearlyBucketList.updateMany({
        where: { id: listId, householdId, status: { not: 'ARCHIVED' } },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.description !== undefined
            ? { description: input.description.trim() || null }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedByUserId: userId,
        },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action: 'BUCKET_LIST_UPDATED',
        householdId,
        userId,
        entityType: 'YearlyBucketList',
        entityId: listId,
        metadata: { listId, changedFields: Object.keys(input) },
      });
      return true;
    });
  }

  public async setStatus(
    householdId: string,
    userId: string,
    listId: string,
    status: 'CLOSED' | 'ARCHIVED',
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.yearlyBucketList.updateMany({
        where: { id: listId, householdId, status: { not: 'ARCHIVED' } },
        data: {
          status,
          updatedByUserId: userId,
          ...(status === 'CLOSED'
            ? { closedAt: new Date() }
            : { archivedAt: new Date() }),
        },
      });
      if (!result.count) return false;
      await this.audit.record(transaction, {
        action:
          status === 'CLOSED' ? 'BUCKET_LIST_CLOSED' : 'BUCKET_LIST_ARCHIVED',
        householdId,
        userId,
        entityType: 'YearlyBucketList',
        entityId: listId,
        metadata: { listId },
      });
      return true;
    });
  }

  public async statusCounts(householdId: string, listId: string) {
    const groups = await this.prisma.bucketListItem.groupBy({
      by: ['status'],
      where: { householdId, bucketListId: listId },
      _count: { _all: true },
    });
    return Object.fromEntries(
      groups.map((group) => [group.status, group._count._all]),
    ) as Partial<Record<'PLANNED' | 'COMPLETED' | 'SKIPPED', number>>;
  }

  public dashboard(householdId: string, year: number) {
    return this.prisma.yearlyBucketList.findUnique({
      where: { householdId_year: { householdId, year } },
      include: {
        items: {
          where: { status: { in: ['PLANNED', 'COMPLETED'] } },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
          orderBy: [
            { priority: 'desc' },
            { targetDate: { sort: 'asc', nulls: 'last' } },
            { sortOrder: 'asc' },
          ],
          take: 5,
        },
      },
    });
  }
}

export type BucketListRecord = NonNullable<
  Awaited<ReturnType<PrismaBucketListRepository['find']>>
>;

function trimmedOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}
