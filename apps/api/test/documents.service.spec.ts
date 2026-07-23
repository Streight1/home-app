import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { HttpStatus } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiException } from '../src/common/errors/api-exception.js';
import type { AppConfigService } from '../src/config/app-config.service.js';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { LocalFileStorageService } from '../src/infrastructure/storage/local-file-storage.service.js';
import type { StoragePort } from '../src/infrastructure/storage/storage.port.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import { AttachDocumentFileService } from '../src/modules/documents/application/commands/attach-document-file.service.js';
import { CreateDocumentService } from '../src/modules/documents/application/commands/create-document.service.js';
import { RestoreDocumentService } from '../src/modules/documents/application/commands/restore-document.service.js';
import { GetDocumentFileService } from '../src/modules/documents/application/files/get-document-file.service.js';
import { DocumentFileValidator } from '../src/modules/documents/application/document-file.validator.js';
import { DocumentTypeRegistryService } from '../src/modules/documents/application/metadata/document-type-registry.service.js';
import { ValidateDocumentMetadataService } from '../src/modules/documents/application/metadata/validate-document-metadata.service.js';
import { DownloadDocumentFileService } from '../src/modules/documents/application/queries/download-document-file.service.js';
import { GetDocumentDetailService } from '../src/modules/documents/application/queries/get-document-detail.service.js';
import { ListDocumentsService } from '../src/modules/documents/application/queries/list-documents.service.js';
import type {
  CreateDocumentRecordInput,
  DocumentRecord,
  DocumentRepository,
} from '../src/modules/documents/domain/document.repository.js';
import { PrismaDocumentRepository } from '../src/modules/documents/infrastructure/prisma-document.repository.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import type { DocumentFolderRepository } from '../src/modules/documents/domain/ports/document-folder.repository.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const documentId = '30000000-0000-4000-8000-000000000003';

function recordFromInput(input: CreateDocumentRecordInput): DocumentRecord {
  const now = new Date('2026-07-14T10:00:00.000Z');
  return {
    id: input.id,
    householdId: input.householdId,
    folderId: input.folderId ?? null,
    folder: null,
    title: input.title,
    description: input.description,
    notes: input.notes ?? null,
    type: input.type ?? 'GENERAL',
    metadataJson: input.metadataJson ?? {},
    metadataSchemaVersion: input.metadataSchemaVersion ?? 1,
    metadataOriginsJson: {},
    status: 'ACTIVE',
    documentDate: input.documentDate ?? null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    trashedAt: null,
    trashedByUserId: null,
    trashedFromFolderId: null,
    trashedFromFolder: null,
    createdBy: {
      id: input.userId,
      displayName: 'Jana',
      email: 'jana@example.com',
    },
    file: {
      ...input.file,
      sanitizedFilename:
        input.file.sanitizedFilename ?? input.file.originalFilename,
      extension: input.file.extension ?? 'pdf',
      detectedMimeType: input.file.detectedMimeType ?? input.file.mimeType,
      version: input.file.version ?? 1,
      createdAt: now,
    },
  };
}

function pdfBuffer(): Buffer {
  return Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF');
}

function jpegBuffer(): Buffer {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0xff, 0xd9,
  ]);
}

function upload(buffer: Buffer, originalname: string, mimetype: string) {
  return { buffer, originalname, mimetype, size: buffer.length };
}

function repositoryHarness() {
  const repository = {
    create: vi.fn((input: CreateDocumentRecordInput) =>
      Promise.resolve(recordFromInput(input)),
    ),
    list: vi.fn(),
    findById: vi.fn(),
    updateMetadata: vi.fn(),
    move: vi.fn(),
    applyExtractedMetadata: vi.fn(),
    setStatus: vi.fn(),
    findManyByIds: vi.fn(),
    recordFileAccess: vi.fn().mockResolvedValue(undefined),
  };
  return {
    raw: repository,
    typed: repository as unknown as DocumentRepository,
  };
}

function accessHarness(role = 'MEMBER') {
  const access = {
    getActiveMembership: vi
      .fn()
      .mockResolvedValue({ householdId, userId, role }),
  };
  return { raw: access, typed: access as unknown as HouseholdAccessService };
}

function folderHarness() {
  return {
    list: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByNormalizedName: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countContents: vi.fn(),
    delete: vi.fn(),
  } as unknown as DocumentFolderRepository;
}

function createService(
  access: HouseholdAccessService,
  repository: DocumentRepository,
  validator: DocumentFileValidator,
  storagePort: StoragePort,
) {
  const registry = new DocumentTypeRegistryService();
  return new CreateDocumentService(
    access,
    validator,
    new AttachDocumentFileService(storagePort, repository),
    folderHarness(),
    registry,
    new ValidateDocumentMetadataService(registry),
  );
}

describe('document application services', () => {
  let root: string;
  let config: AppConfigService;
  let storage: LocalFileStorageService;
  let validator: DocumentFileValidator;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'homeapp-documents-'));
    config = {
      uploadRoot: root,
      maxUploadBytes: 1_024 * 1_024,
    } as AppConfigService;
    storage = new LocalFileStorageService(config);
    await storage.onModuleInit();
    validator = new DocumentFileValidator(config);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('rejects a VIEWER before writing an upload', async () => {
    const repository = repositoryHarness();
    const access = accessHarness('VIEWER');
    access.raw.getActiveMembership.mockRejectedValue(
      new ApiException(
        HttpStatus.FORBIDDEN,
        'HOUSEHOLD_ACCESS_DENIED',
        'Zakázáno.',
      ),
    );
    const service = createService(
      access.typed,
      repository.typed,
      validator,
      storage,
    );
    await expect(
      service.execute(
        userId,
        { title: 'Dokument', documentType: 'GENERAL', metadata: {} },
        upload(pdfBuffer(), 'file.pdf', 'application/pdf'),
      ),
    ).rejects.toMatchObject({ code: 'HOUSEHOLD_ACCESS_DENIED' });
    expect(repository.raw.create).not.toHaveBeenCalled();
  });

  it('stores a valid PDF for a MEMBER with checksum and server path', async () => {
    const repository = repositoryHarness();
    const access = accessHarness();
    const service = createService(
      access.typed,
      repository.typed,
      validator,
      storage,
    );
    const buffer = pdfBuffer();
    const response = await service.execute(
      userId,
      {
        title: 'Pojistka',
        description: 'Rodinný dokument',
        documentType: 'GENERAL',
        metadata: {},
      },
      upload(buffer, 'Moje pojistka.pdf', 'application/pdf'),
    );
    const input = repository.raw.create.mock.calls[0]?.[0];
    expect(response.title).toBe('Pojistka');
    expect(input?.file.storageKey).toMatch(
      new RegExp(`^documents/${householdId}/[0-9a-f-]{36}/[0-9a-f-]{36}$`, 'i'),
    );
    expect(input?.file.storageKey).not.toContain('Moje pojistka.pdf');
    expect(input?.file.checksumSha256).toBe(
      createHash('sha256').update(buffer).digest('hex'),
    );
    expect(await storage.exists(input?.file.storageKey ?? '')).toBe(true);
  });

  it('accepts a valid JPEG signature', async () => {
    const validated = await validator.validate(
      upload(jpegBuffer(), 'foto.jpeg', 'image/jpeg'),
    );
    expect(validated.mimeType).toBe('image/jpeg');
    expect(validated.sizeBytes).toBe(jpegBuffer().length);
  });

  it('rejects an unsupported declared type', async () => {
    await expect(
      validator.validate(
        upload(Buffer.from('<html>'), 'page.html', 'text/html'),
      ),
    ).rejects.toMatchObject({ code: 'DOCUMENT_INVALID_FILE' });
  });

  it('rejects a file over MAX_UPLOAD_BYTES', async () => {
    const smallValidator = new DocumentFileValidator({
      maxUploadBytes: 5,
    } as AppConfigService);
    await expect(
      smallValidator.validate(
        upload(pdfBuffer(), 'file.pdf', 'application/pdf'),
      ),
    ).rejects.toMatchObject({ code: 'DOCUMENT_FILE_TOO_LARGE' });
  });

  it('rejects an empty file', async () => {
    await expect(
      validator.validate(
        upload(Buffer.alloc(0), 'file.pdf', 'application/pdf'),
      ),
    ).rejects.toMatchObject({ code: 'DOCUMENT_INVALID_FILE' });
  });

  it('removes a stored file when the database transaction fails', async () => {
    const repository = repositoryHarness();
    repository.raw.create.mockRejectedValue(new Error('database unavailable'));
    const write = vi.spyOn(storage, 'write');
    const file = await validator.validate(
      upload(pdfBuffer(), 'file.pdf', 'application/pdf'),
    );
    await expect(
      new AttachDocumentFileService(storage, repository.typed).execute({
        documentId,
        householdId,
        userId,
        title: 'Dokument',
        description: null,
        file,
      }),
    ).rejects.toThrow('database unavailable');
    const storageKey = (await write.mock.results[0]?.value)?.storageKey;
    expect(storageKey).toBeDefined();
    expect(await storage.exists(storageKey ?? '')).toBe(false);
  });

  it('does not create a database record when storage fails', async () => {
    const repository = repositoryHarness();
    const failedStorage = {
      write: vi.fn().mockRejectedValue(new Error('storage unavailable')),
    } as unknown as StoragePort;
    const file = await validator.validate(
      upload(pdfBuffer(), 'file.pdf', 'application/pdf'),
    );
    await expect(
      new AttachDocumentFileService(failedStorage, repository.typed).execute({
        documentId,
        householdId,
        userId,
        title: 'Dokument',
        description: null,
        file,
      }),
    ).rejects.toThrow('storage unavailable');
    expect(repository.raw.create).not.toHaveBeenCalled();
  });

  it('scopes document detail to the active household and returns generic 404', async () => {
    const repository = repositoryHarness();
    repository.raw.findById.mockResolvedValue(null);
    const service = new GetDocumentDetailService(
      accessHarness().typed,
      repository.typed,
    );
    await expect(service.execute(userId, documentId)).rejects.toMatchObject({
      code: 'DOCUMENT_NOT_FOUND',
      message: 'Dokument nebyl nalezen.',
    });
    expect(repository.raw.findById).toHaveBeenCalledWith(
      householdId,
      documentId,
    );
  });

  it('uses ACTIVE as the default list status', async () => {
    const repository = repositoryHarness();
    repository.raw.list.mockResolvedValue({ items: [], totalItems: 0 });
    const service = new ListDocumentsService(
      accessHarness().typed,
      repository.typed,
      folderHarness(),
    );
    const result = await service.execute(userId, {
      page: 1,
      pageSize: 20,
      includeSubfolders: false,
      status: 'ACTIVE',
      sortBy: 'createdAt',
      sortDirection: 'desc',
    });
    expect(repository.raw.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE' }),
    );
    expect(result.pagination.totalPages).toBe(0);
  });

  it('restores an archived document to ACTIVE', async () => {
    const repository = repositoryHarness();
    const archived = {
      ...recordFromInput({
        id: documentId,
        householdId,
        userId,
        title: 'Dokument',
        description: null,
        file: {
          id: '40000000-0000-4000-8000-000000000004',
          storageKey: 'documents/key',
          originalFilename: 'file.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 10,
          checksumSha256: 'a'.repeat(64),
        },
      }),
      status: 'ARCHIVED' as const,
      archivedAt: new Date(),
    };
    repository.raw.findById.mockResolvedValue(archived);
    repository.raw.setStatus.mockResolvedValue({
      ...archived,
      status: 'ACTIVE',
      archivedAt: null,
    });
    const response = await new RestoreDocumentService(
      accessHarness().typed,
      repository.typed,
    ).execute(userId, documentId);
    expect(response.status).toBe('ACTIVE');
    expect(repository.raw.setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE', archivedAt: null }),
    );
  });

  it('allows a VIEWER to download through StoragePort', async () => {
    const repository = repositoryHarness();
    const record = recordFromInput({
      id: documentId,
      householdId,
      userId,
      title: 'Dokument',
      description: null,
      file: {
        id: '40000000-0000-4000-8000-000000000004',
        storageKey: 'documents/test-key',
        originalFilename: 'file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
        checksumSha256: 'a'.repeat(64),
      },
    });
    repository.raw.findById.mockResolvedValue(record);
    const storagePort = {
      read: vi.fn().mockResolvedValue(Readable.from('pdf')),
    } as unknown as StoragePort;
    const fileAccess = new GetDocumentFileService(
      accessHarness('VIEWER').typed,
      repository.typed,
      storagePort,
    );
    const result = await new DownloadDocumentFileService(
      fileAccess,
      repository.typed,
    ).execute(userId, documentId);
    expect(result.disposition).toContain('attachment');
    expect(result.mimeType).toBe('application/pdf');
    expect(repository.raw.recordFileAccess).toHaveBeenCalled();
  });

  it('writes audit metadata without the internal storage key', async () => {
    const input: CreateDocumentRecordInput = {
      id: documentId,
      householdId,
      userId,
      title: 'Dokument',
      description: null,
      file: {
        id: '40000000-0000-4000-8000-000000000004',
        storageKey: 'documents/private-storage-key',
        originalFilename: 'file.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
        checksumSha256: 'a'.repeat(64),
      },
    };
    const transaction = {
      document: { create: vi.fn().mockResolvedValue(recordFromInput(input)) },
    };
    const prisma = {
      $transaction: vi.fn(
        (callback: (value: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    } as unknown as PrismaService;
    const audit = {
      record: vi.fn().mockResolvedValue(undefined),
    } as unknown as AuditService;
    await new PrismaDocumentRepository(prisma, audit).create(input);
    const event = vi.mocked(audit.record).mock.calls[0]?.[1];
    expect(JSON.stringify(event?.metadata)).not.toContain('storageKey');
    expect(event).toMatchObject({
      action: 'DOCUMENT_CREATED',
      entityId: documentId,
    });
  });
});
