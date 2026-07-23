import { Injectable } from '@nestjs/common';
import type { HouseholdRole } from '../../households/household.types.js';
import {
  bucketListProgress,
  dateOnlyString,
} from '../domain/bucket-list.types.js';
import type { BucketListItemRecord } from '../infrastructure/prisma-bucket-list-item.repository.js';
import type { BucketListRecord } from '../infrastructure/prisma-bucket-list.repository.js';

@Injectable()
export class BucketListResponseMapper {
  public list(
    record: BucketListRecord,
    counts: Partial<Record<'PLANNED' | 'COMPLETED' | 'SKIPPED', number>>,
    role: HouseholdRole,
  ) {
    const progress = bucketListProgress({
      planned: counts.PLANNED ?? 0,
      completed: counts.COMPLETED ?? 0,
      skipped: counts.SKIPPED ?? 0,
    });
    return {
      id: record.id,
      year: record.year,
      title: record.title,
      description: record.description,
      status: record.status,
      progress,
      createdBy: record.createdBy,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      closedAt: record.closedAt?.toISOString() ?? null,
      archivedAt: record.archivedAt?.toISOString() ?? null,
      permissions: {
        canEdit: role !== 'VIEWER' && record.status !== 'ARCHIVED',
        canClose: role !== 'VIEWER' && record.status === 'ACTIVE',
        canArchive: role !== 'VIEWER' && record.status !== 'ARCHIVED',
      },
    };
  }

  public item(record: BucketListItemRecord, role: HouseholdRole) {
    const canMutate = role !== 'VIEWER';
    return {
      id: record.id,
      bucketListId: record.bucketListId,
      title: record.title,
      description: record.description,
      category: record.category,
      priority: record.priority,
      status: record.status,
      targetDate: dateOnlyString(record.targetDate),
      location:
        record.locationPlaceId || record.locationLabel
          ? {
              placeId: record.locationPlaceId,
              label: record.locationLabel,
              notes: record.locationNotes,
              routable: Boolean(record.locationPlaceId),
            }
          : null,
      notes: record.notes,
      sortOrder: record.sortOrder,
      participants: record.participants.map(({ user }) => ({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        calendarColorToken:
          user.householdMembers[0]?.calendarColorToken ?? 'violet',
      })),
      documents: record.documents.map(({ document }) => ({
        id: document.id,
        type: document.type,
        primaryLabel: document.title,
        canPreview: document.status !== 'TRASHED',
      })),
      completion: record.completedAt
        ? {
            completedAt: record.completedAt.toISOString(),
            completedByUserId: record.completedByUserId,
          }
        : null,
      skipped: record.skippedAt
        ? {
            skippedAt: record.skippedAt.toISOString(),
            skippedByUserId: record.skippedByUserId,
            reason: record.skippedReason,
          }
        : null,
      completions: record.completions.map((completion) => ({
        id: completion.id,
        completedAt: completion.completedAt.toISOString(),
        note: completion.note,
        completedBy: completion.completedBy,
      })),
      rollover: {
        carriedFrom: record.carriedFromItem,
        carriedTo: record.carriedToItem,
      },
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      permissions: {
        canEdit: canMutate,
        canComplete: canMutate && record.status === 'PLANNED',
        canReopen: canMutate && record.status === 'COMPLETED',
        canSkip: canMutate && record.status === 'PLANNED',
        canRestore: canMutate && record.status === 'SKIPPED',
        canDelete: canMutate,
      },
    };
  }
}
