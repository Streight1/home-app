import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { BucketListDashboardService } from '../src/modules/bucket-list/application/bucket-list-dashboard.service.js';
import { BucketListInputValidationService } from '../src/modules/bucket-list/application/bucket-list-input-validation.service.js';
import { BucketListService } from '../src/modules/bucket-list/application/bucket-list.service.js';
import { bucketListProgress } from '../src/modules/bucket-list/domain/bucket-list.types.js';
import { PrismaBucketListLifecycleRepository } from '../src/modules/bucket-list/infrastructure/prisma-bucket-list-lifecycle.repository.js';
import { PrismaBucketListRolloverRepository } from '../src/modules/bucket-list/infrastructure/prisma-bucket-list-rollover.repository.js';
import type { PrismaBucketListRepository } from '../src/modules/bucket-list/infrastructure/prisma-bucket-list.repository.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import type { DocumentsFacade } from '../src/modules/documents/documents.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import type { LocationFacade } from '../src/modules/location/location.facade.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { BucketListResponseMapper } from '../src/modules/bucket-list/application/bucket-list-response.mapper.js';

describe('bucket list progress', () => {
  it('uses completed divided by all yearly items', () => {
    expect(
      bucketListProgress({ planned: 4, completed: 3, skipped: 1 }),
    ).toEqual({ planned: 4, completed: 3, skipped: 1, total: 8, percent: 38 });
  });

  it('is deterministic for an empty list', () => {
    expect(
      bucketListProgress({ planned: 0, completed: 0, skipped: 0 }),
    ).toEqual({ planned: 0, completed: 0, skipped: 0, total: 0, percent: 0 });
  });
});

describe('bucket list household and role boundary', () => {
  it('derives household identity from the authenticated membership', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const repository = {
      create: vi.fn().mockResolvedValue('list-id'),
      find: vi.fn().mockResolvedValue({
        id: 'list-id',
        year: 2026,
        title: 'Bucket list 2026',
        description: null,
        status: 'ACTIVE',
        createdBy: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: null,
        archivedAt: null,
      }),
      statusCounts: vi.fn().mockResolvedValue({}),
    } as unknown as PrismaBucketListRepository;
    const mapper = {
      list: vi.fn().mockReturnValue({ id: 'list-id' }),
    } as unknown as BucketListResponseMapper;
    const service = new BucketListService(access, repository, mapper);
    await service.create('user-a', { year: 2026, status: 'ACTIVE' });
    expect(repository.create).toHaveBeenCalledWith(
      'household-a',
      'user-a',
      expect.objectContaining({ year: 2026 }),
    );
  });

  it('does not let a viewer create a list', async () => {
    const access = {
      getActiveMembership: vi.fn().mockRejectedValue(new ForbiddenException()),
    } as unknown as HouseholdAccessService;
    const service = new BucketListService(
      access,
      { create: vi.fn() } as unknown as PrismaBucketListRepository,
      {} as BucketListResponseMapper,
    );
    await expect(
      service.create('viewer', { year: 2026, status: 'ACTIVE' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('turns a duplicate household/year constraint into a safe conflict', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const repository = {
      create: vi.fn().mockRejectedValue({ code: 'P2002' }),
    } as unknown as PrismaBucketListRepository;
    const service = new BucketListService(
      access,
      repository,
      {} as BucketListResponseMapper,
    );
    await expect(
      service.create('user-a', { year: 2026, status: 'ACTIVE' }),
    ).rejects.toMatchObject({ code: 'BUCKET_LIST_CONFLICT' });
  });
});

describe('bucket list relation validation', () => {
  it('checks participants, documents and a structured place through public APIs', async () => {
    const access = {
      assertActiveMembers: vi.fn().mockResolvedValue(undefined),
    } as unknown as HouseholdAccessService;
    const documents = {
      verifyAccessibleSummaries: vi.fn().mockResolvedValue([{ id: 'doc-a' }]),
    } as unknown as DocumentsFacade;
    const locations = {
      findAccessiblePlace: vi.fn().mockResolvedValue({
        id: 'place-a',
        label: 'Praha',
        routable: true,
      }),
    } as unknown as LocationFacade;
    const validation = new BucketListInputValidationService(
      access,
      documents,
      locations,
    );
    await expect(
      validation.validate('user-a', 'household-a', {
        participantUserIds: ['member-a', 'member-a'],
        documentIds: ['doc-a'],
        locationPlaceId: 'place-a',
        locationLabel: 'client value',
      }),
    ).resolves.toEqual({
      participantUserIds: ['member-a'],
      documentIds: ['doc-a'],
      locationLabel: 'Praha',
    });
    expect(access.assertActiveMembers).toHaveBeenCalledWith('household-a', [
      'member-a',
    ]);
    expect(documents.verifyAccessibleSummaries).toHaveBeenCalledWith('user-a', [
      'doc-a',
    ]);
  });

  it('rejects a place outside the household without revealing it', async () => {
    const validation = new BucketListInputValidationService(
      {
        assertActiveMembers: vi.fn(),
      } as unknown as HouseholdAccessService,
      {} as DocumentsFacade,
      {
        findAccessiblePlace: vi.fn().mockResolvedValue(null),
      } as unknown as LocationFacade,
    );
    await expect(
      validation.validate('user-a', 'household-a', {
        locationPlaceId: 'foreign-place',
      }),
    ).rejects.toMatchObject({ code: 'BUCKET_LIST_INVALID' });
  });
});

describe('bucket list completion history', () => {
  it('completes the item and appends a history record atomically', async () => {
    const transaction = {
      bucketListItem: {
        findFirst: vi.fn().mockResolvedValue({ id: 'item-a' }),
        update: vi.fn().mockResolvedValue({}),
      },
      bucketListItemCompletion: {
        create: vi.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
        Promise.resolve(callback(transaction)),
      ),
    } as unknown as PrismaService;
    const audit = { record: vi.fn() } as unknown as AuditService;
    const repository = new PrismaBucketListLifecycleRepository(prisma, audit);
    const at = new Date('2026-07-23T12:00:00.000Z');
    await repository.execute({
      householdId: 'household-a',
      userId: 'user-a',
      itemId: 'item-a',
      action: 'complete',
      at,
      note: 'Společně hotovo',
    });
    expect(transaction.bucketListItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', completedAt: at }),
      }),
    );
    expect(transaction.bucketListItemCompletion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bucketListItemId: 'item-a',
        completedByUserId: 'user-a',
        note: 'Společně hotovo',
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      transaction,
      expect.objectContaining({
        action: 'BUCKET_LIST_ITEM_COMPLETED',
        metadata: { itemId: 'item-a' },
      }),
    );
  });

  it('does not put a private completion note into audit metadata', async () => {
    const transaction = {
      bucketListItem: {
        findFirst: vi.fn().mockResolvedValue({ id: 'item-a' }),
        update: vi.fn(),
      },
      bucketListItemCompletion: { create: vi.fn() },
    };
    const audit = { record: vi.fn() } as unknown as AuditService;
    const repository = new PrismaBucketListLifecycleRepository(
      {
        $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
          Promise.resolve(callback(transaction)),
        ),
      } as unknown as PrismaService,
      audit,
    );
    await repository.execute({
      householdId: 'household-a',
      userId: 'user-a',
      itemId: 'item-a',
      action: 'complete',
      at: new Date(),
      note: 'soukromá poznámka',
    });
    expect(JSON.stringify(vi.mocked(audit.record).mock.calls)).not.toContain(
      'soukromá poznámka',
    );
  });

  it('does not append a duplicate history record for repeated completion', async () => {
    const transaction = {
      bucketListItem: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'item-a',
          status: 'COMPLETED',
        }),
        update: vi.fn(),
      },
      bucketListItemCompletion: { create: vi.fn() },
    };
    const audit = { record: vi.fn() } as unknown as AuditService;
    const repository = new PrismaBucketListLifecycleRepository(
      {
        $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
          Promise.resolve(callback(transaction)),
        ),
      } as unknown as PrismaService,
      audit,
    );
    await expect(
      repository.execute({
        householdId: 'household-a',
        userId: 'user-a',
        itemId: 'item-a',
        action: 'complete',
        at: new Date('2026-07-23T12:00:00.000Z'),
      }),
    ).resolves.toBe(true);
    expect(transaction.bucketListItem.update).not.toHaveBeenCalled();
    expect(transaction.bucketListItemCompletion.create).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });
});

describe('bucket list dashboard', () => {
  it('uses the injected clock and only the current household', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'VIEWER' }),
    } as unknown as HouseholdAccessService;
    const repository = {
      dashboard: vi.fn().mockResolvedValue(null),
    } as unknown as PrismaBucketListRepository;
    const service = new BucketListDashboardService(access, repository, {
      now: () => new Date('2026-07-23T10:00:00.000Z'),
    });
    await expect(service.get('viewer')).resolves.toMatchObject({
      year: 2026,
      list: null,
      items: [],
    });
    expect(repository.dashboard).toHaveBeenCalledWith('household-a', 2026);
  });
});

describe('bucket list rollover', () => {
  it('offers only planned or skipped items that were not carried already', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new PrismaBucketListRolloverRepository(
      {
        bucketListItem: { findMany },
      } as unknown as PrismaService,
      { record: vi.fn() } as unknown as AuditService,
    );
    await repository.candidates('household-a', 'list-2026');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          householdId: 'household-a',
          bucketListId: 'list-2026',
          status: { in: ['PLANNED', 'SKIPPED'] },
          carriedToItem: null,
        },
      }),
    );
  });

  it('creates a new linked item without copying completion history', async () => {
    const createItem = vi.fn().mockResolvedValue({ id: 'item-2027' });
    const transaction = {
      yearlyBucketList: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'list-2027',
          year: 2027,
        }),
        create: vi.fn(),
      },
      bucketListItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'item-2026',
            title: 'Společný výlet',
            description: null,
            category: 'TRAVEL',
            priority: 'HIGH',
            targetDate: new Date('2026-08-15T00:00:00.000Z'),
            locationPlaceId: null,
            locationLabel: 'Český ráj',
            locationNotes: null,
            notes: null,
            sortOrder: 2,
            participants: [{ userId: 'member-a' }],
            documents: [{ documentId: 'document-a' }],
          },
        ]),
        create: createItem,
      },
    };
    const repository = new PrismaBucketListRolloverRepository(
      {
        $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
          Promise.resolve(callback(transaction)),
        ),
      } as unknown as PrismaService,
      { record: vi.fn() } as unknown as AuditService,
    );
    await expect(
      repository.carry({
        householdId: 'household-a',
        userId: 'user-a',
        sourceListId: 'list-2026',
        sourceYear: 2026,
        targetYear: 2027,
        itemIds: ['item-2026'],
        carryDocuments: true,
        carryTargetDate: false,
      }),
    ).resolves.toEqual({
      targetListId: 'list-2027',
      createdItemIds: ['item-2027'],
    });
    expect(createItem).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bucketListId: 'list-2027',
        carriedFromItemId: 'item-2026',
        status: 'PLANNED',
        targetDate: null,
        participants: {
          create: [{ userId: 'member-a', addedByUserId: 'user-a' }],
        },
        documents: {
          create: [{ documentId: 'document-a', createdByUserId: 'user-a' }],
        },
      }),
    });
    expect(JSON.stringify(createItem.mock.calls)).not.toContain('completion');
  });

  it('rejects a repeated or concurrently changed rollover atomically', async () => {
    const transaction = {
      yearlyBucketList: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'list-2027',
          year: 2027,
        }),
      },
      bucketListItem: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn(),
      },
    };
    const repository = new PrismaBucketListRolloverRepository(
      {
        $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
          Promise.resolve(callback(transaction)),
        ),
      } as unknown as PrismaService,
      { record: vi.fn() } as unknown as AuditService,
    );
    await expect(
      repository.carry({
        householdId: 'household-a',
        userId: 'user-a',
        sourceListId: 'list-2026',
        sourceYear: 2026,
        targetYear: 2027,
        itemIds: ['item-already-carried'],
        carryDocuments: true,
        carryTargetDate: false,
      }),
    ).rejects.toMatchObject({ code: 'BUCKET_LIST_INVALID' });
    expect(transaction.bucketListItem.create).not.toHaveBeenCalled();
  });
});
