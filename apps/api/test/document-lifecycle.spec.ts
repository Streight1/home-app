import { HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import type { StoragePort } from '../src/infrastructure/storage/storage.port.js';
import { PermanentlyDeleteDocumentService } from '../src/modules/documents/application/commands/permanently-delete-document.service.js';
import { TrashDocumentService } from '../src/modules/documents/application/commands/trash-document.service.js';
import { StoredFileDeletionWorker } from '../src/modules/documents/application/files/stored-file-deletion.worker.js';
import { DocumentListPresentationService } from '../src/modules/documents/application/presentation/document-list-presentation.service.js';
import {
  permanentDeleteTombstone,
  resolveTrashRestoreFolderId,
} from '../src/modules/documents/domain/document-lifecycle.js';
import type {
  DocumentRecord,
  DocumentRepository,
} from '../src/modules/documents/domain/document.repository.js';
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
    const repository = {
      findDeletionTasks: vi.fn().mockResolvedValue([
        {
          id: 'task-1',
          storageKey: 'private-key',
          status: 'FAILED',
          attempts: 1,
        },
      ]),
      markDeletionTaskProcessing: vi.fn(),
      completeDeletionTask: vi.fn(),
      failDeletionTask: vi.fn(),
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
    );
    await worker.processPending('task-1');
    expect(repository.completeDeletionTask).toHaveBeenCalledWith('task-1');
  });
});
