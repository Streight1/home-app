import { Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  bucketListNotFound,
  invalidBucketList,
} from '../domain/bucket-list.errors.js';
import {
  BUCKET_LIST_READ_ROLE,
  BUCKET_LIST_WRITE_ROLE,
  dateOnlyString,
} from '../domain/bucket-list.types.js';
import { PrismaBucketListRepository } from '../infrastructure/prisma-bucket-list.repository.js';
import { PrismaBucketListRolloverRepository } from '../infrastructure/prisma-bucket-list-rollover.repository.js';
import type {
  CarryBucketListItemsDto,
  PrepareBucketListRolloverDto,
} from '../presentation/dto/bucket-list.dto.js';

@Injectable()
export class BucketListRolloverService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly lists: PrismaBucketListRepository,
    private readonly rollover: PrismaBucketListRolloverRepository,
  ) {}

  public async prepare(
    userId: string,
    sourceListId: string,
    input: PrepareBucketListRolloverDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_READ_ROLE,
    );
    const source = await this.lists.find(membership.householdId, sourceListId);
    if (!source) throw bucketListNotFound();
    validateTargetYear(source.year, input.targetYear);
    const target = await this.lists.findByYear(
      membership.householdId,
      input.targetYear,
    );
    const candidates = await this.rollover.candidates(
      membership.householdId,
      sourceListId,
    );
    return {
      source: { id: source.id, year: source.year, title: source.title },
      target: target
        ? { id: target.id, year: target.year, title: target.title }
        : null,
      candidates: candidates.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        category: item.category,
        priority: item.priority,
        targetDate: dateOnlyString(item.targetDate),
        participantCount: item.participants.length,
        documentCount: item.documents.length,
      })),
    };
  }

  public async carry(
    userId: string,
    sourceListId: string,
    input: CarryBucketListItemsDto,
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    const source = await this.lists.find(membership.householdId, sourceListId);
    if (!source) throw bucketListNotFound();
    validateTargetYear(source.year, input.targetYear);
    const candidates = await this.rollover.candidates(
      membership.householdId,
      sourceListId,
    );
    const candidateIds = new Set(candidates.map((item) => item.id));
    const requestedIds = [...new Set(input.itemIds)];
    if (
      requestedIds.length === 0 ||
      requestedIds.some((itemId) => !candidateIds.has(itemId))
    )
      throw invalidBucketList(
        'Některé položky už byly přeneseny, jsou dokončené nebo nepatří do seznamu.',
      );
    const result = await this.rollover.carry({
      householdId: membership.householdId,
      userId,
      sourceListId,
      sourceYear: source.year,
      targetYear: input.targetYear,
      itemIds: requestedIds,
      carryDocuments: input.carryDocuments,
      carryTargetDate: input.carryTargetDate,
    });
    return {
      targetListId: result.targetListId,
      carriedItemCount: result.createdItemIds.length,
    };
  }
}

function validateTargetYear(sourceYear: number, targetYear: number) {
  if (targetYear <= sourceYear)
    throw invalidBucketList(
      'Cílový rok musí následovat po roce zdrojového seznamu.',
    );
}
