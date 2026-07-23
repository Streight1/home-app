import { Inject, Injectable } from '@nestjs/common';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import {
  BUCKET_LIST_CLOCK,
  type BucketListClock,
} from '../domain/bucket-list-clock.port.js';
import {
  BUCKET_LIST_READ_ROLE,
  bucketListProgress,
  dateOnlyString,
} from '../domain/bucket-list.types.js';
import { PrismaBucketListRepository } from '../infrastructure/prisma-bucket-list.repository.js';

@Injectable()
export class BucketListDashboardService {
  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly lists: PrismaBucketListRepository,
    @Inject(BUCKET_LIST_CLOCK) private readonly clock: BucketListClock,
  ) {}

  public async get(userId: string, requestedYear?: number) {
    const membership = await this.access.getActiveMembership(
      userId,
      BUCKET_LIST_READ_ROLE,
    );
    const year = requestedYear ?? this.clock.now().getFullYear();
    const list = await this.lists.dashboard(membership.householdId, year);
    if (!list)
      return {
        year,
        list: null,
        progress: bucketListProgress({
          planned: 0,
          completed: 0,
          skipped: 0,
        }),
        items: [],
      };
    const counts = await this.lists.statusCounts(
      membership.householdId,
      list.id,
    );
    return {
      year,
      list: { id: list.id, title: list.title, status: list.status },
      progress: bucketListProgress({
        planned: counts.PLANNED ?? 0,
        completed: counts.COMPLETED ?? 0,
        skipped: counts.SKIPPED ?? 0,
      }),
      items: list.items.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        category: item.category,
        priority: item.priority,
        targetDate: dateOnlyString(item.targetDate),
        participants: item.participants.map(({ user }) => ({
          id: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        })),
        permissions: { canComplete: membership.role !== 'VIEWER' },
        navigationTarget: {
          area: 'bucket-list' as const,
          screen: 'item' as const,
          itemId: item.id,
        },
      })),
    };
  }
}
