import { readFile } from 'node:fs/promises';
import { HttpStatus, Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { StoragePort } from '../src/infrastructure/storage/storage.port.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import { PermanentlyDeleteDocumentService } from '../src/modules/documents/application/commands/permanently-delete-document.service.js';
import { TrashDocumentService } from '../src/modules/documents/application/commands/trash-document.service.js';
import { StoredFileDeletionWorker } from '../src/modules/documents/application/files/stored-file-deletion.worker.js';
import { DocumentListPresentationService } from '../src/modules/documents/application/presentation/document-list-presentation.service.js';
import {
  permanentDeleteTombstone,
  resolveTrashRestoreFolderId,
} from '../src/modules/documents/domain/document-lifecycle.js';
import {
  STORED_FILE_DELETION_LEASE_MS,
  STORED_FILE_DELETION_MAX_ATTEMPTS,
  type DocumentRecord,
  type DocumentRepository,
} from '../src/modules/documents/domain/document.repository.js';
import { PrismaDocumentRepository } from '../src/modules/documents/infrastructure/prisma-document.repository.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const documentId = '30000000-0000-4000-8000-000000000003';

function document(
  status: 'ACTIVE' | 'ARCHIVED' | 'TRASHED' = 'ACTIVE',
): DocumentRecord {
  return {
    id: documentId,
    householdId,
    folderId: null,
    folder: null,
    title: '2026071401',
    description: 'Notebook Lenovo ThinkPad a příslušenství',
    notes: null,
    type: 'INVOICE',
    metadataJson: {
      supplierName: 'Alza.cz',
      purchaseSummary: 'Notebook Lenovo ThinkPad a příslušenství',
      invoiceNumber: '123456789',
      issueDate: '2026-07-14',
      totalAmountMinor: 3_899_000,
      currencyCode: 'CZK',
    },
    metadataSchemaVersion: 2,
    metadataOriginsJson: {},
    status,
    documentDate: null,
    createdAt: new Date('2026-07-14T10:00:00.000Z'),
    updatedAt: new Date('2026-07-14T10:00:00.000Z'),
    archivedAt: null,
    trashedAt:
      status === 'TRASHED' ? new Date('2026-07-15T10:00:00.000Z') : null,
    trashedByUserId: status === 'TRASHED' ? userId : null,
    trashedFromFolderId: null,
    trashedFromFolder: null,
    createdBy: { id: userId, displayName: 'Adam', email: 'adam@example.test' },
    file: {
      id: '40000000-0000-4000-8000-000000000004',
      storageKey: 'documents/internal-secret',
      originalFilename: 'invoice.pdf',
      sanitizedFilename: 'invoice.pdf',
      extension: 'pdf',
      mimeType: 'application/pdf',
      detectedMimeType: 'application/pdf',
      sizeBytes: 100,
      checksumSha256: 'a'.repeat(64),
      version: 1,
      createdAt: new Date('2026-07-14T10:00:00.000Z'),
    },
  };
}

function access(role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER') {
  return {
    getActiveMembership: vi.fn().mockImplementation((_userId, minimum) => {
      const ranks = { VIEWER: 1, MEMBER: 2, ADMIN: 3, OWNER: 4 };
      if (ranks[role] < ranks[minimum as keyof typeof ranks])
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          'HOUSEHOLD_ACCESS_DENIED',
          'Pro tuto akci nemáte dostatečné oprávnění.',
        );
      return Promise.resolve({ householdId, userId, role });
    }),
  } as unknown as HouseholdAccessService;
}

describe('document presentation and lifecycle', () => {
  it('presents an invoice by supplier, purchase summary, reference and amount', () => {
    const result = new DocumentListPresentationService().map(
      document(),
      'MEMBER',
    );
    expect(result.presentation).toMatchObject({
      primaryLabel: 'Alza.cz',
      secondaryLabel: 'Notebook Lenovo ThinkPad a příslušenství',
      referenceLabel: 'Faktura 123456789',
      amount: { minorUnits: 3_899_000, currencyCode: 'CZK' },
    });
    expect(JSON.stringify(result)).not.toContain('storageKey');
    expect(JSON.stringify(result)).not.toContain('internal-secret');
  });

  it('uses a safe title fallback when supplier metadata is missing', () => {
    const record = document();
    record.metadataJson = {};
    expect(
      new DocumentListPresentationService().map(record, 'VIEWER').presentation
        .primaryLabel,
    ).toBe('2026071401');
  });

  it('denies moving to trash for a viewer and permits a member', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(document()),
      moveToTrash: vi.fn().mockResolvedValue(document('TRASHED')),
    } as unknown as DocumentRepository;
    await expect(
      new TrashDocumentService(access('VIEWER'), repository).execute(
        userId,
        documentId,
      ),
    ).rejects.toMatchObject({ code: 'HOUSEHOLD_ACCESS_DENIED' });
    await new TrashDocumentService(access('MEMBER'), repository).execute(
      userId,
      documentId,
    );
    expect(repository.moveToTrash).toHaveBeenCalled();
  });

  it('requires admin for permanent deletion and queues the stored file task', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(document('TRASHED')),
      permanentlyDelete: vi.fn().mockResolvedValue({ taskId: 'task-1' }),
    } as unknown as DocumentRepository;
    const worker = { enqueue: vi.fn() } as unknown as StoredFileDeletionWorker;
    await expect(
      new PermanentlyDeleteDocumentService(
        access('MEMBER'),
        repository,
        worker,
      ).execute(userId, documentId),
    ).rejects.toMatchObject({ code: 'HOUSEHOLD_ACCESS_DENIED' });
    await new PermanentlyDeleteDocumentService(
      access('ADMIN'),
      repository,
      worker,
    ).execute(userId, documentId);
    expect(repository.permanentlyDelete).toHaveBeenCalled();
    expect(worker.enqueue).toHaveBeenCalledWith('task-1');
  });

  it('rejects direct permanent deletion of an active document', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(document('ACTIVE')),
    } as unknown as DocumentRepository;
    await expect(
      new PermanentlyDeleteDocumentService(access('ADMIN'), repository, {
        enqueue: vi.fn(),
      } as unknown as StoredFileDeletionWorker).execute(userId, documentId),
    ).rejects.toMatchObject({ code: 'DOCUMENT_INVALID_STATE' });
  });

  it('restores to the original folder when it exists and otherwise to root', () => {
    expect(resolveTrashRestoreFolderId('folder-1', true)).toBe('folder-1');
    expect(resolveTrashRestoreFolderId('folder-1', false)).toBeNull();
    expect(resolveTrashRestoreFolderId(null, true)).toBeNull();
  });

  it('keeps only a minimal non-sensitive deletion tombstone', () => {
    const tombstone = permanentDeleteTombstone(documentId, 'INVOICE');
    expect(tombstone).toEqual({ documentId, type: 'INVOICE' });
    expect(JSON.stringify(tombstone)).not.toMatch(
      /storageKey|metadata|notes|filename|amount/i,
    );
  });

  it('marks failed storage deletion for retry and later completes it', async () => {
    const claimedAt = new Date('2026-07-31T10:00:00.000Z');
    const repository = {
      claimDeletionTasks: vi.fn().mockResolvedValue([
        {
          id: 'task-1',
          storageKey: 'private-key',
          status: 'PROCESSING',
          attempts: 2,
          processingStartedAt: claimedAt,
        },
      ]),
      completeDeletionTask: vi.fn().mockResolvedValue(true),
      failDeletionTask: vi.fn().mockResolvedValue(true),
    } as unknown as DocumentRepository;
    const storage = {
      delete: vi
        .fn()
        .mockRejectedValueOnce(new Error('disk'))
        .mockResolvedValue(undefined),
    } as unknown as StoragePort;
    const worker = new StoredFileDeletionWorker(repository, storage);
    await worker.processPending('task-1');
    expect(repository.failDeletionTask).toHaveBeenCalledWith(
      'task-1',
      'STORAGE_DELETE_FAILED',
      claimedAt,
    );
    await worker.processPending('task-1');
    expect(repository.completeDeletionTask).toHaveBeenCalledWith(
      'task-1',
      claimedAt,
    );
  });

  it.each(['claim', 'failure-bookkeeping'] as const)(
    'contains scheduled %s database failures without an unhandled rejection',
    async (failurePoint) => {
      const claimedAt = new Date('2026-07-31T10:00:00.000Z');
      const repository = {
        claimDeletionTasks:
          failurePoint === 'claim'
            ? vi.fn().mockRejectedValue(new Error('DATABASE_URL=secret'))
            : vi.fn().mockResolvedValue([
                {
                  id: 'task-1',
                  storageKey: 'private-key',
                  status: 'PROCESSING',
                  attempts: 2,
                  processingStartedAt: claimedAt,
                },
              ]),
        completeDeletionTask: vi.fn(),
        failDeletionTask: vi
          .fn()
          .mockRejectedValue(new Error('DATABASE_URL=secret')),
      } as unknown as DocumentRepository;
      const storage = {
        delete: vi.fn().mockRejectedValue(new Error('storage unavailable')),
      } as unknown as StoragePort;
      const errorLog = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const worker = new StoredFileDeletionWorker(repository, storage);

      try {
        worker.enqueue('task-1');
        await new Promise<void>((resolve) => setImmediate(resolve));

        expect(errorLog).toHaveBeenCalledWith({
          code: 'STORED_FILE_DELETE_WORKER_FAILED',
          taskId: 'task-1',
        });
        expect(JSON.stringify(errorLog.mock.calls)).not.toContain('secret');
      } finally {
        errorLog.mockRestore();
      }
    },
  );

  it('atomically claims a deletion task when two workers compete', async () => {
    const databaseNow = new Date('2026-07-31T12:00:00.000Z');
    const candidate = {
      id: 'task-1',
      storageKey: 'private-key',
      status: 'PENDING' as const,
      attempts: 0,
      processingStartedAt: null,
    };
    let claimed = false;
    const updateMany = vi.fn(async ({ data }: { data: { status: string } }) => {
      if (data.status === 'FAILED') return { count: 0 };
      await Promise.resolve();
      if (claimed) return { count: 0 };
      claimed = true;
      return { count: 1 };
    });
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ claimedAt: databaseNow }]),
      storedFileDeletionTask: {
        findMany: vi.fn().mockResolvedValue([candidate]),
        updateMany,
      },
    };
    const prisma = {
      $transaction: vi.fn(
        (callback: (value: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
      storedFileDeletionTask: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    } as unknown as PrismaService;
    const repository = new PrismaDocumentRepository(prisma, {
      record: vi.fn(),
    } as unknown as AuditService);
    const storage = {
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as StoragePort;
    const firstWorker = new StoredFileDeletionWorker(repository, storage);
    const secondWorker = new StoredFileDeletionWorker(repository, storage);

    await Promise.all([
      firstWorker.processPending('task-1'),
      secondWorker.processPending('task-1'),
    ]);

    const claimCalls = updateMany.mock.calls
      .map(([input]) => input)
      .filter((input) => input.data.status === 'PROCESSING');
    expect(claimCalls).toHaveLength(2);
    expect(claimCalls[0]).toEqual({
      where: {
        id: 'task-1',
        OR: [
          {
            status: { in: ['PENDING', 'FAILED'] },
            attempts: { lt: STORED_FILE_DELETION_MAX_ATTEMPTS },
          },
          {
            status: 'PROCESSING',
            attempts: { lt: STORED_FILE_DELETION_MAX_ATTEMPTS },
            processingStartedAt: { lte: expect.any(Date) },
          },
        ],
      },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
        processingStartedAt: databaseNow,
        lastErrorCode: null,
      },
    });
    expect(updateMany).toHaveBeenCalledTimes(4);
    expect(storage.delete).toHaveBeenCalledTimes(1);
    expect(prisma.storedFileDeletionTask.updateMany).toHaveBeenCalledTimes(1);
  });

  it('uses the database clock to reclaim only an expired processing lease', async () => {
    const databaseNow = new Date('2026-07-31T12:00:00.000Z');
    const hostNow = new Date('2040-01-01T00:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(hostNow);
    const staleStartedAt = new Date(
      databaseNow.getTime() - STORED_FILE_DELETION_LEASE_MS - 1,
    );
    const freshStartedAt = new Date(
      databaseNow.getTime() - STORED_FILE_DELETION_LEASE_MS + 1,
    );
    const staleTask = {
      id: 'task-after-crash',
      storageKey: 'private-key',
      status: 'PROCESSING' as const,
      attempts: STORED_FILE_DELETION_MAX_ATTEMPTS - 1,
      processingStartedAt: staleStartedAt,
    };
    const freshTask = {
      ...staleTask,
      id: 'task-still-owned',
      processingStartedAt: freshStartedAt,
    };
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ claimedAt: databaseNow }]),
      storedFileDeletionTask: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          const cutoff = where.OR[1].processingStartedAt.lte as Date;
          expect(cutoff).toEqual(
            new Date(databaseNow.getTime() - STORED_FILE_DELETION_LEASE_MS),
          );
          return Promise.resolve(
            [staleTask, freshTask].filter(
              (task) => task.processingStartedAt <= cutoff,
            ),
          );
        }),
        updateMany: vi
          .fn()
          .mockResolvedValueOnce({ count: 0 })
          .mockResolvedValueOnce({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        (callback: (value: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;
    const repository = new PrismaDocumentRepository(prisma, {
      record: vi.fn(),
    } as unknown as AuditService);

    try {
      await expect(repository.claimDeletionTasks(20)).resolves.toEqual([
        {
          id: 'task-after-crash',
          storageKey: 'private-key',
          status: 'PROCESSING',
          attempts: STORED_FILE_DELETION_MAX_ATTEMPTS,
          processingStartedAt: databaseNow,
        },
      ]);
      expect(new Date()).toEqual(hostNow);
      expect(transaction.$queryRaw).toHaveBeenCalledOnce();
      expect(
        transaction.storedFileDeletionTask.updateMany,
      ).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('terminalizes an expired fifth processing attempt instead of claiming a sixth', async () => {
    const databaseNow = new Date('2026-07-31T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2040-01-01T00:00:00.000Z'));
    const state = {
      status: 'PROCESSING',
      attempts: STORED_FILE_DELETION_MAX_ATTEMPTS,
      processingStartedAt: new Date(
        databaseNow.getTime() - STORED_FILE_DELETION_LEASE_MS - 1,
      ) as Date | null,
      lastErrorCode: null as string | null,
    };
    const transaction = {
      $queryRaw: vi.fn().mockResolvedValue([{ claimedAt: databaseNow }]),
      storedFileDeletionTask: {
        updateMany: vi.fn().mockImplementation(({ data }) => {
          if (data.status !== 'FAILED') {
            throw new Error('A sixth claim must not be attempted.');
          }
          state.status = data.status;
          state.processingStartedAt = data.processingStartedAt;
          state.lastErrorCode = data.lastErrorCode;
          return Promise.resolve({ count: 1 });
        }),
        findMany: vi.fn().mockImplementation(({ where }) => {
          expect(where.OR).toEqual([
            {
              status: { in: ['PENDING', 'FAILED'] },
              attempts: { lt: STORED_FILE_DELETION_MAX_ATTEMPTS },
            },
            {
              status: 'PROCESSING',
              attempts: { lt: STORED_FILE_DELETION_MAX_ATTEMPTS },
              processingStartedAt: { lte: expect.any(Date) },
            },
          ]);
          return Promise.resolve([]);
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        (callback: (value: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;
    const repository = new PrismaDocumentRepository(prisma, {
      record: vi.fn(),
    } as unknown as AuditService);

    try {
      await expect(repository.claimDeletionTasks(20)).resolves.toEqual([]);
      expect(
        transaction.storedFileDeletionTask.updateMany,
      ).toHaveBeenCalledOnce();
      expect(
        transaction.storedFileDeletionTask.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          status: 'PROCESSING',
          attempts: { gte: STORED_FILE_DELETION_MAX_ATTEMPTS },
          processingStartedAt: {
            lte: new Date(
              databaseNow.getTime() - STORED_FILE_DELETION_LEASE_MS,
            ),
          },
        },
        data: {
          status: 'FAILED',
          processingStartedAt: null,
          lastErrorCode: 'STORAGE_DELETE_RETRY_EXHAUSTED',
        },
      });
      expect(state).toEqual({
        status: 'FAILED',
        attempts: STORED_FILE_DELETION_MAX_ATTEMPTS,
        processingStartedAt: null,
        lastErrorCode: 'STORAGE_DELETE_RETRY_EXHAUSTED',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('only completes or fails the worker lease that still owns the task', async () => {
    const claimedAt = new Date('2026-07-31T12:00:00.000Z');
    const staleClaimedAt = new Date('2026-07-31T11:00:00.000Z');
    const updateMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    const prisma = {
      storedFileDeletionTask: { updateMany },
    } as unknown as PrismaService;
    const repository = new PrismaDocumentRepository(prisma, {
      record: vi.fn(),
    } as unknown as AuditService);

    await expect(
      repository.completeDeletionTask('task-1', staleClaimedAt),
    ).resolves.toBe(false);
    await expect(
      repository.failDeletionTask('task-1', 'STORAGE_DELETE_FAILED', claimedAt),
    ).resolves.toBe(true);

    expect(updateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'task-1',
        status: 'PROCESSING',
        processingStartedAt: staleClaimedAt,
      },
      data: {
        status: 'COMPLETED',
        completedAt: expect.any(Date),
        lastErrorCode: null,
        processingStartedAt: null,
      },
    });
    expect(updateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: 'task-1',
        status: 'PROCESSING',
        processingStartedAt: claimedAt,
      },
      data: {
        status: 'FAILED',
        lastErrorCode: 'STORAGE_DELETE_FAILED',
        processingStartedAt: null,
      },
    });
  });

  it('migrates in-flight leases safely across mixed API versions', async () => {
    const leaseMigration = await readFile(
      new URL(
        '../prisma/migrations/20260731160000_stored_file_deletion_processing_lease/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );
    const mixedVersionGuard = await readFile(
      new URL(
        '../prisma/migrations/20260731163000_stored_file_deletion_mixed_version_guard/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );

    expect(leaseMigration).toMatch(
      /UPDATE "StoredFileDeletionTask"[\s\S]*"status" = 'PROCESSING'[\s\S]*"processingStartedAt" IS NULL/,
    );
    expect(leaseMigration).toContain(
      'CREATE INDEX "StoredFileDeletionTask_lease_idx"',
    );
    expect(mixedVersionGuard).toMatch(
      /CREATE TRIGGER "StoredFileDeletionTask_processing_lease_trigger"[\s\S]*BEFORE INSERT OR UPDATE OF "status"/,
    );
    expect(mixedVersionGuard).toMatch(
      /NEW\."status" = 'PROCESSING'[\s\S]*NEW\."processingStartedAt" IS NULL[\s\S]*CURRENT_TIMESTAMP/,
    );
    expect(mixedVersionGuard.indexOf('CREATE TRIGGER')).toBeLessThan(
      mixedVersionGuard.indexOf('UPDATE "StoredFileDeletionTask"'),
    );
  });
});
