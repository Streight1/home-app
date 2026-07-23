import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  bucketListItemNotFound,
  bucketListNotFound,
  invalidBucketList,
} from '../domain/bucket-list.errors.js';
import {
  BUCKET_LIST_READ_ROLE,
  BUCKET_LIST_WRITE_ROLE,
} from '../domain/bucket-list.types.js';
import { PrismaBucketListItemRepository } from '../infrastructure/prisma-bucket-list-item.repository.js';
import { PrismaBucketListRepository } from '../infrastructure/prisma-bucket-list.repository.js';
import type {
  CreateBucketListItemDto,
  ListBucketListItemsQueryDto,
  UpdateBucketListItemDto,
} from '../presentation/dto/bucket-list.dto.js';
import { BucketListInputValidationService } from './bucket-list-input-validation.service.js';
import { BucketListResponseMapper } from './bucket-list-response.mapper.js';

@Injectable()
export class BucketListItemService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly lists: PrismaBucketListRepository,
    private readonly items: PrismaBucketListItemRepository,
    private readonly validation: BucketListInputValidationService,
    private readonly responses: BucketListResponseMapper,
  ) {}

  public async list(
    userId: string,
    listId: string,
    query: ListBucketListItemsQueryDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_READ_ROLE,
    );
    if (!(await this.lists.find(membership.householdId, listId)))
      throw bucketListNotFound();
    return {
      items: (await this.items.list(membership.householdId, listId, query)).map(
        (item) => this.responses.item(item, membership.role),
      ),
    };
  }

  public async detail(userId: string, itemId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_READ_ROLE,
    );
    const item = await this.items.find(membership.householdId, itemId);
    if (!item) throw bucketListItemNotFound();
    return this.responses.item(item, membership.role);
  }

  public async create(
    userId: string,
    listId: string,
    input: CreateBucketListItemDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    await this.assertWritableList(membership.householdId, listId);
    const validated = await this.validation.validate(
      userId,
      membership.householdId,
      input,
    );
    const id = await this.items.create({
      householdId: membership.householdId,
      userId,
      bucketListId: listId,
      item: Object.assign({}, input, validated),
    });
    return this.detail(userId, id);
  }

  public async update(
    userId: string,
    itemId: string,
    input: UpdateBucketListItemDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    const current = await this.items.find(membership.householdId, itemId);
    if (!current) throw bucketListItemNotFound();
    await this.assertWritableList(membership.householdId, current.bucketListId);
    const validated = await this.validation.validate(
      userId,
      membership.householdId,
      input,
    );
    if (
      !(await this.items.update({
        householdId: membership.householdId,
        userId,
        itemId,
        item: Object.assign({}, input, validated),
      }))
    )
      throw bucketListItemNotFound();
    return this.detail(userId, itemId);
  }

  public async remove(userId: string, itemId: string) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    const current = await this.items.find(membership.householdId, itemId);
    if (!current) throw bucketListItemNotFound();
    await this.assertWritableList(membership.householdId, current.bucketListId);
    if (!(await this.items.remove(membership.householdId, userId, itemId)))
      throw bucketListItemNotFound();
    return { id: itemId };
  }

  private async assertWritableList(householdId: string, listId: string) {
    const list = await this.lists.find(householdId, listId);
    if (!list) throw bucketListNotFound();
    if (['CLOSED', 'ARCHIVED'].includes(list.status))
      throw invalidBucketList('Uzavřený nebo archivovaný seznam nelze měnit.');
  }
}
