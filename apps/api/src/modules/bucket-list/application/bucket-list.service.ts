import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  bucketListConflict,
  bucketListNotFound,
  invalidBucketList,
} from '../domain/bucket-list.errors.js';
import {
  BUCKET_LIST_READ_ROLE,
  BUCKET_LIST_WRITE_ROLE,
} from '../domain/bucket-list.types.js';
import { PrismaBucketListRepository } from '../infrastructure/prisma-bucket-list.repository.js';
import type {
  CreateBucketListDto,
  ListBucketListsQueryDto,
  UpdateBucketListDto,
} from '../presentation/dto/bucket-list.dto.js';
import { BucketListResponseMapper } from './bucket-list-response.mapper.js';

@Injectable()
export class BucketListService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly lists: PrismaBucketListRepository,
    private readonly responses: BucketListResponseMapper,
  ) {}

  public async list(userId: string, query: ListBucketListsQueryDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_READ_ROLE,
    );
    const records = await this.lists.list(membership.householdId, query);
    return {
      items: await Promise.all(
        records.map(async (record) =>
          this.responses.list(
            record,
            await this.lists.statusCounts(membership.householdId, record.id),
            membership.role,
          ),
        ),
      ),
    };
  }

  public async detail(userId: string, listId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_READ_ROLE,
    );
    const record = await this.lists.find(membership.householdId, listId);
    if (!record) throw bucketListNotFound();
    return this.responses.list(
      record,
      await this.lists.statusCounts(membership.householdId, record.id),
      membership.role,
    );
  }

  public async create(userId: string, input: CreateBucketListDto) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    try {
      const id = await this.lists.create(membership.householdId, userId, input);
      return await this.detail(userId, id);
    } catch (error) {
      if (isUniqueConstraint(error))
        throw bucketListConflict(
          `Roční seznam pro rok ${String(input.year)} už existuje.`,
        );
      throw error;
    }
  }

  public async update(
    userId: string,
    listId: string,
    input: UpdateBucketListDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    const current = await this.lists.find(membership.householdId, listId);
    if (!current) throw bucketListNotFound();
    if (['CLOSED', 'ARCHIVED'].includes(current.status))
      throw invalidBucketList('Uzavřený nebo archivovaný seznam nelze měnit.');
    if (
      !(await this.lists.update(membership.householdId, userId, listId, input))
    )
      throw bucketListNotFound();
    return this.detail(userId, listId);
  }

  public async setStatus(
    userId: string,
    listId: string,
    status: 'CLOSED' | 'ARCHIVED',
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    if (
      !(await this.lists.setStatus(
        membership.householdId,
        userId,
        listId,
        status,
      ))
    )
      throw bucketListNotFound();
    return this.detail(userId, listId);
  }
}

const isUniqueConstraint = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';
