import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import { CreateFolderService } from '../src/modules/documents/application/folders/create-folder.service.js';
import {
  buildFolderTree,
  descendantIds,
  folderDepth,
} from '../src/modules/documents/application/folders/folder-tree.js';
import { MoveFolderService } from '../src/modules/documents/application/folders/move-folder.service.js';
import { DocumentTypeRegistryService } from '../src/modules/documents/application/metadata/document-type-registry.service.js';
import { ValidateDocumentMetadataService } from '../src/modules/documents/application/metadata/validate-document-metadata.service.js';
import { ListDocumentsService } from '../src/modules/documents/application/queries/list-documents.service.js';
import type { DocumentFolderRecord } from '../src/modules/documents/domain/folders/document-folder.js';
import type { DocumentFolderRepository } from '../src/modules/documents/domain/ports/document-folder.repository.js';
import type { DocumentRepository } from '../src/modules/documents/domain/document.repository.js';
import { ListDocumentsQueryDto } from '../src/modules/documents/presentation/dto/list-documents-query.dto.js';
import { UpdateDocumentDto } from '../src/modules/documents/presentation/dto/update-document.dto.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const userId = '20000000-0000-4000-8000-000000000002';
const now = new Date('2026-07-14T10:00:00.000Z');

function folder(id: string, parentId: string | null): DocumentFolderRecord {
  return {
    id,
    householdId,
    parentId,
    name: `Složka ${id}`,
    normalizedName: `slozka-${id}`,
    createdAt: now,
    updatedAt: now,
  };
}

function access(role = 'MEMBER') {
  return {
    getActiveMembership: vi
      .fn()
      .mockResolvedValue({ householdId, userId, role }),
  } as unknown as HouseholdAccessService;
}

function folders(items: DocumentFolderRecord[] = []) {
  return {
    list: vi.fn().mockResolvedValue(items),
    findById: vi.fn(),
    findByNormalizedName: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        ...folder(input.id as string, input.parentId as string | null),
        name: input.name as string,
        normalizedName: input.normalizedName as string,
      }),
    ),
    update: vi.fn().mockImplementation((input) =>
      Promise.resolve({
        ...items.find((item) => item.id === input.folderId),
        parentId: input.parentId,
      }),
    ),
    countContents: vi.fn(),
    delete: vi.fn(),
  };
}

describe('document library foundation', () => {
  it.each([10, 20, 50, 100])('accepts pageSize %i', async (pageSize) => {
    const dto = plainToInstance(ListDocumentsQueryDto, {
      pageSize: String(pageSize),
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.pageSize).toBe(pageSize);
  });

  it('rejects a page size outside the fixed allowlist', async () => {
    const dto = plainToInstance(ListDocumentsQueryDto, { pageSize: '25' });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('builds a hierarchical folder tree', () => {
    const root = folder('a', null);
    const child = folder('b', 'a');
    const tree = buildFolderTree([child, root]);
    expect(tree).toMatchObject([
      { id: 'a', children: [{ id: 'b', children: [] }] },
    ]);
    expect(folderDepth([root, child], 'b')).toBe(2);
  });

  it('detects descendant cycles', () => {
    expect(() =>
      descendantIds([folder('a', 'b'), folder('b', 'a')], 'a'),
    ).toThrow();
  });

  it('rejects moving a folder into its own descendant', async () => {
    const repository = folders([folder('a', null), folder('b', 'a')]);
    const service = new MoveFolderService(
      access(),
      repository as unknown as DocumentFolderRepository,
    );
    await expect(service.execute(userId, 'a', 'b')).rejects.toMatchObject({
      code: 'DOCUMENT_FOLDER_INVALID',
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects creating a folder deeper than level ten', async () => {
    const items = Array.from({ length: 10 }, (_, index) =>
      folder(String(index + 1), index === 0 ? null : String(index)),
    );
    const service = new CreateFolderService(
      access(),
      folders(items) as unknown as DocumentFolderRepository,
    );
    await expect(
      service.execute(userId, 'Příliš hluboko', '10'),
    ).rejects.toMatchObject({
      code: 'DOCUMENT_FOLDER_INVALID',
    });
  });

  it('rejects a duplicate normalized folder name in one parent', async () => {
    const repository = folders();
    repository.findByNormalizedName.mockResolvedValue(folder('a', null));
    const service = new CreateFolderService(
      access(),
      repository as unknown as DocumentFolderRepository,
    );
    await expect(
      service.execute(userId, 'Pojištění', null),
    ).rejects.toMatchObject({
      code: 'DOCUMENT_FOLDER_DUPLICATE',
    });
  });

  it('delegates folder and sorting constraints to the repository', async () => {
    const root = folder('a', null);
    const child = folder('b', 'a');
    const repository = {
      list: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    } as unknown as DocumentRepository;
    const service = new ListDocumentsService(
      access(),
      repository,
      folders([root, child]) as unknown as DocumentFolderRepository,
    );
    await service.execute(userId, {
      page: 1,
      pageSize: 20,
      folderId: 'a',
      includeSubfolders: true,
      status: 'ACTIVE',
      sortBy: 'documentDate',
      sortDirection: 'asc',
    });
    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        folderIds: ['a', 'b'],
        sortBy: 'documentDate',
        sortDirection: 'asc',
      }),
    );
  });

  it('validates invoice amounts as safe integer minor units', () => {
    const registry = new DocumentTypeRegistryService();
    const validator = new ValidateDocumentMetadataService(registry);
    expect(() =>
      validator.validate('INVOICE', 1, { totalAmountMinor: 123.45 }),
    ).toThrow();
    expect(
      validator.validate('INVOICE', 1, {
        totalAmountMinor: 12_345,
        currencyCode: 'CZK',
      }),
    ).toMatchObject({ totalAmountMinor: 12_345, currencyCode: 'CZK' });
  });

  it('rejects unknown metadata keys and unsupported currencies', () => {
    const registry = new DocumentTypeRegistryService();
    const validator = new ValidateDocumentMetadataService(registry);
    expect(() =>
      validator.validate('INVOICE', 1, { executableScript: 'bad' }),
    ).toThrow();
    expect(() =>
      validator.validate('INVOICE', 1, { currencyCode: 'USD' }),
    ).toThrow();
  });

  it('rejects impossible date-only metadata values', () => {
    const registry = new DocumentTypeRegistryService();
    const validator = new ValidateDocumentMetadataService(registry);

    expect(() =>
      validator.validate('INVOICE', 1, { issueDate: '2026-02-30' }),
    ).toThrow();
    expect(
      validator.validate('INVOICE', 1, { issueDate: '2026-02-28' }),
    ).toEqual({ issueDate: '2026-02-28' });
  });

  it('limits notes to 50,000 plain-text characters', async () => {
    const dto = plainToInstance(UpdateDocumentDto, {
      notes: 'x'.repeat(50_001),
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
