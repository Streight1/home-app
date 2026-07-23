import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  bucketListItemNotFound,
  invalidBucketList,
} from '../domain/bucket-list.errors.js';
import {
  BUCKET_LIST_CLOCK,
  type BucketListClock,
} from '../domain/bucket-list-clock.port.js';
import {
  BUCKET_LIST_WRITE_ROLE,
  dateOnly,
} from '../domain/bucket-list.types.js';
import { PrismaBucketListItemRepository } from '../infrastructure/prisma-bucket-list-item.repository.js';
import { PrismaBucketListLifecycleRepository } from '../infrastructure/prisma-bucket-list-lifecycle.repository.js';
import type {
  BucketListCompletionDto,
  SkipBucketListItemDto,
} from '../presentation/dto/bucket-list.dto.js';
import { BucketListResponseMapper } from './bucket-list-response.mapper.js';

@Injectable()
export class BucketListLifecycleService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly items: PrismaBucketListItemRepository,
    private readonly lifecycle: PrismaBucketListLifecycleRepository,
    private readonly responses: BucketListResponseMapper,
    @Inject(BUCKET_LIST_CLOCK) private readonly clock: BucketListClock,
  ) {}

  public complete(
    userId: string,
    itemId: string,
    input: BucketListCompletionDto,
  ) {
    return this.execute(userId, itemId, 'complete', {
      at: input.completedDate
        ? completedInstant(input.completedDate, this.clock.now())
        : this.clock.now(),
      ...(input.note !== undefined ? { note: input.note } : {}),
      expectedStatus: 'PLANNED',
    });
  }

  public reopen(userId: string, itemId: string) {
    return this.execute(userId, itemId, 'reopen', {
      at: this.clock.now(),
      expectedStatus: 'COMPLETED',
    });
  }

  public skip(userId: string, itemId: string, input: SkipBucketListItemDto) {
    return this.execute(userId, itemId, 'skip', {
      at: this.clock.now(),
      ...(input.reason !== undefined ? { note: input.reason } : {}),
      expectedStatus: 'PLANNED',
    });
  }

  public restore(userId: string, itemId: string) {
    return this.execute(userId, itemId, 'restore', {
      at: this.clock.now(),
      expectedStatus: 'SKIPPED',
    });
  }

  private async execute(
    userId: string,
    itemId: string,
    action: 'complete' | 'reopen' | 'skip' | 'restore',
    input: { at: Date; note?: string; expectedStatus: string },
  ) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_WRITE_ROLE,
    );
    const current = await this.items.find(membership.householdId, itemId);
    if (!current) throw bucketListItemNotFound();
    if (current.status !== input.expectedStatus)
      throw invalidBucketList('Položka není ve stavu vhodném pro tuto akci.');
    if (
      !(await this.lifecycle.execute({
        householdId: membership.householdId,
        userId,
        itemId,
        action,
        at: input.at,
        ...(input.note !== undefined ? { note: input.note } : {}),
      }))
    )
      throw bucketListItemNotFound();
    const updated = await this.items.find(membership.householdId, itemId);
    if (!updated) throw bucketListItemNotFound();
    return this.responses.item(updated, membership.role);
  }
}

function completedInstant(date: string, now: Date): Date {
  const parsed = dateOnly(date);
  parsed.setUTCHours(
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds(),
  );
  return parsed;
}
