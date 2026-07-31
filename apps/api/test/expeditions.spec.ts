import { ForbiddenException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import type { DocumentsFacade } from '../src/modules/documents/documents.facade.js';
import { GearImagesService } from '../src/modules/expeditions/application/gear-images.service.js';
import { GearCategoriesService } from '../src/modules/expeditions/application/gear-categories.service.js';
import { GearService } from '../src/modules/expeditions/application/gear.service.js';
import { ExpeditionWeightService } from '../src/modules/expeditions/domain/expedition-weight.service.js';
import { TripReadinessService } from '../src/modules/expeditions/domain/trip-readiness.service.js';
import type { GearImageHttpPort } from '../src/modules/expeditions/images/gear-image-http.port.js';
import type { GearImageSearchPort } from '../src/modules/expeditions/images/gear-image-search.port.js';
import {
  isBlockedNetworkAddress,
  validatePublicImageUrl,
} from '../src/modules/expeditions/images/image-network-policy.js';
import { sanitizeImage } from '../src/modules/expeditions/images/image-sanitizer.js';
import type { GearService as GearServiceType } from '../src/modules/expeditions/application/gear.service.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import { ExpeditionsSearchProvider } from '../src/modules/expeditions/expeditions-search.provider.js';

const pngChunk = (type: string, data = Buffer.alloc(0)) => {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  return chunk;
};

const minimalPng = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pngChunk('IHDR', Buffer.alloc(13)),
  pngChunk('tEXt', Buffer.from('private metadata')),
  pngChunk('IEND'),
]);

describe('expedition weight domain', () => {
  const service = new ExpeditionWeightService();
  const item = (
    overrides: Partial<Parameters<typeof service.calculate>[0][number]> = {},
  ) => ({
    id: crypto.randomUUID(),
    name: 'Položka',
    categoryNameSnapshot: 'Batoh',
    assignedUserId: 'member-a',
    quantity: '1',
    unitWeightGrams: 1_000,
    loadType: 'CARRIED' as const,
    packingStatus: 'PLANNED' as const,
    ...overrides,
  });

  it('calculates carried, worn, consumable and starting weights exactly', () => {
    const result = service.calculate([
      item({
        id: 'carried',
        name: 'Stan',
        quantity: '1.5',
        unitWeightGrams: 1_001,
      }),
      item({
        id: 'worn',
        name: 'Bunda',
        loadType: 'WORN',
        unitWeightGrams: 400,
      }),
      item({
        id: 'food',
        name: 'Jídlo',
        loadType: 'CONSUMABLE',
        unitWeightGrams: 600,
      }),
      item({
        id: 'excluded',
        name: 'Vyloučeno',
        packingStatus: 'EXCLUDED',
        unitWeightGrams: 9_999,
      }),
    ]);
    expect(result).toMatchObject({
      baseWeightGrams: 1_502,
      wornWeightGrams: 400,
      consumableWeightGrams: 600,
      startingPackWeightGrams: 2_102,
      systemWeightGrams: 2_502,
      totalPlannedWeightGrams: 2_502,
    });
  });

  it('includes missing items in planned weight and counts packed weight once', () => {
    const result = service.calculate([
      item({ id: 'packed', name: 'Sbaleno', packingStatus: 'PACKED' }),
      item({
        id: 'missing',
        name: 'Chybí',
        packingStatus: 'MISSING',
        unitWeightGrams: 500,
      }),
      item({
        id: 'shared',
        name: 'Sdílený stan',
        assignedUserId: 'member-b',
        unitWeightGrams: 2_000,
      }),
    ]);
    expect(result.baseWeightGrams).toBe(3_500);
    expect(result.packedWeightGrams).toBe(1_000);
    expect(result.participantWeights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'member-a', baseWeightGrams: 1_500 }),
        expect.objectContaining({ key: 'member-b', baseWeightGrams: 2_000 }),
      ]),
    );
  });

  it('rounds Decimal quantities deterministically to whole grams', () => {
    expect(
      service.itemWeight(item({ quantity: '0.333', unitWeightGrams: 1_000 })),
    ).toBe(333);
    expect(() => service.itemWeight(item({ quantity: '1e3' }))).toThrow(
      expect.objectContaining({ code: 'EXPEDITIONS_INVALID_INPUT' }),
    );
  });
});

describe('trip readiness domain', () => {
  const service = new TripReadinessService();
  const required = {
    id: 'required',
    name: 'Lékárnička',
    criticality: 'REQUIRED' as const,
    packingStatus: 'PLANNED' as const,
    isShared: true,
    assignedUserId: null,
    categoryName: 'Lékárnička',
  };

  it('blocks READY for unpacked, missing or unassigned shared required gear', () => {
    const result = service.evaluate({ tripType: 'DAY_HIKE' }, [required]);
    expect(result).toMatchObject({
      ready: false,
      unpackedRequiredCount: 1,
      unassignedSharedRequiredCount: 1,
    });
    expect(
      service.evaluate({ tripType: 'DAY_HIKE' }, [
        {
          ...required,
          packingStatus: 'PACKED',
          assignedUserId: 'member-a',
        },
      ]).ready,
    ).toBe(true);
  });

  it('returns explainable advisory rules that can be acknowledged', () => {
    const result = service.evaluate(
      { tripType: 'OVERNIGHT' },
      [],
      ['NO_WATER'],
    );
    expect(result.advisoryRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'NO_SLEEP_SYSTEM',
          acknowledged: false,
        }),
        expect.objectContaining({ code: 'NO_WATER', acknowledged: true }),
      ]),
    );
    expect(result.disclaimer).toContain('nenahrazuje');
  });
});

describe('gear image security', () => {
  it('rejects insecure, local and private network URLs', () => {
    expect(() =>
      validatePublicImageUrl('http://example.com/image.png'),
    ).toThrow(expect.objectContaining({ code: 'EXPEDITIONS_INVALID_INPUT' }));
    for (const target of [
      'https://localhost/image.png',
      'https://127.0.0.1/image.png',
      'https://10.10.0.5/image.png',
      'https://192.168.1.5/image.png',
      'https://[::1]/image.png',
    ])
      expect(() => validatePublicImageUrl(target)).toThrow(
        expect.objectContaining({ code: 'EXPEDITIONS_INVALID_INPUT' }),
      );
    expect(isBlockedNetworkAddress('169.254.169.254')).toBe(true);
    expect(isBlockedNetworkAddress('8.8.8.8')).toBe(false);
  });

  it('accepts only bitmap MIME types and strips PNG text metadata', () => {
    const safe = sanitizeImage(minimalPng, 'image/png');
    expect(safe.mimeType).toBe('image/png');
    expect(safe.buffer.includes(Buffer.from('private metadata'))).toBe(false);
    expect(() => sanitizeImage(Buffer.from('<svg/>'), 'image/svg+xml')).toThrow(
      expect.objectContaining({ code: 'EXPEDITIONS_INVALID_INPUT' }),
    );
  });

  it('imports an explicitly selected image only through DocumentsFacade', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const documents = {
      createImportedImage: vi.fn().mockResolvedValue({
        id: 'document-a',
        type: 'GENERAL',
        primaryLabel: 'Fotografie',
        canPreview: true,
      }),
    } as unknown as DocumentsFacade;
    const tx = {
      gearItemDocument: {
        updateMany: vi.fn(),
        create: vi.fn(),
      },
      gearItem: { update: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn(
        async (work: (transaction: typeof tx) => Promise<unknown>) => work(tx),
      ),
    } as unknown as PrismaService;
    const http = {
      get: vi.fn().mockResolvedValue({
        status: 200,
        location: null,
        contentType: 'image/png',
        contentLength: minimalPng.length,
        body: minimalPng,
      }),
    } as unknown as GearImageHttpPort;
    const gear = {
      find: vi.fn().mockResolvedValue({ id: 'gear-a', name: 'Batoh' }),
      detail: vi.fn().mockResolvedValue({ id: 'gear-a' }),
    } as unknown as GearServiceType;
    const service = new GearImagesService(
      prisma,
      access,
      documents,
      gear,
      { record: vi.fn() } as unknown as AuditService,
      http,
      { configured: false, search: vi.fn() } as GearImageSearchPort,
    );
    await service.importFromUrl('member-a', 'gear-a', {
      imageUrl: 'https://images.example.test/backpack.png',
      setAsCover: true,
    });
    expect(documents.createImportedImage).toHaveBeenCalledOnce();
    expect(tx.gearItemDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        gearItemId: 'gear-a',
        documentId: 'document-a',
        relationType: 'PHOTO',
        isCover: true,
      }),
    });
  });

  it('rejects oversized and incorrectly typed downloaded content', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const gear = {
      find: vi.fn().mockResolvedValue({ id: 'gear-a', name: 'Batoh' }),
    } as unknown as GearServiceType;
    const response = {
      status: 200,
      location: null,
      contentType: 'text/html',
      contentLength: 4,
      body: Buffer.from('html'),
    };
    const http = { get: vi.fn().mockResolvedValue(response) };
    const service = new GearImagesService(
      {} as PrismaService,
      access,
      {} as DocumentsFacade,
      gear,
      {} as AuditService,
      http,
      { configured: false, search: vi.fn() },
    );
    await expect(
      service.importFromUrl('member-a', 'gear-a', {
        imageUrl: 'https://images.example.test/file',
        setAsCover: false,
      }),
    ).rejects.toMatchObject({ code: 'EXPEDITIONS_INVALID_INPUT' });
    response.contentType = 'image/png';
    response.body = Buffer.alloc(5 * 1024 * 1024 + 1);
    await expect(
      service.importFromUrl('member-a', 'gear-a', {
        imageUrl: 'https://images.example.test/large.png',
        setAsCover: false,
      }),
    ).rejects.toMatchObject({ code: 'EXPEDITIONS_INVALID_INPUT' });
  });
});

describe('expeditions access and migration boundaries', () => {
  it('requires MEMBER access before gear mutation', async () => {
    const access = {
      getActiveMembership: vi.fn().mockRejectedValue(new ForbiddenException()),
    } as unknown as HouseholdAccessService;
    const service = new GearService(
      {} as PrismaService,
      access,
      {} as DocumentsFacade,
      {} as AuditService,
    );
    await expect(
      service.create('viewer', {
        name: 'Batoh',
        weightGrams: 1_000,
        weightStatus: 'VERIFIED',
        defaultLoadType: 'CARRIED',
        defaultCriticality: 'REQUIRED',
        isHouseholdShared: true,
        defaultQuantity: '1',
        documents: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(access.getActiveMembership).toHaveBeenCalledWith('viewer', 'MEMBER');
  });

  it('requires ADMIN access for categories and creates recommendations idempotently', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'ADMIN' }),
    } as unknown as HouseholdAccessService;
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const transaction = {
      gearCategory: { createMany },
    };
    const prisma = {
      $transaction: vi.fn(
        async (work: (tx: typeof transaction) => Promise<unknown>) =>
          work(transaction),
      ),
    } as unknown as PrismaService;
    const service = new GearCategoriesService(prisma, access, {
      record: vi.fn(),
    } as unknown as AuditService);
    await expect(service.createRecommended('admin-a')).resolves.toEqual({
      createdCount: 13,
    });
    createMany.mockResolvedValue({ count: 0 });
    await expect(service.createRecommended('admin-a')).resolves.toEqual({
      createdCount: 0,
    });
    expect(access.getActiveMembership).toHaveBeenCalledWith('admin-a', 'ADMIN');
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });

  it('returns a generic not-found error for a category from another household', async () => {
    const access = {
      getActiveMembership: vi
        .fn()
        .mockResolvedValue({ householdId: 'household-a', role: 'MEMBER' }),
    } as unknown as HouseholdAccessService;
    const prisma = {
      gearCategory: { count: vi.fn().mockResolvedValue(0) },
    } as unknown as PrismaService;
    const service = new GearService(
      prisma,
      access,
      {} as DocumentsFacade,
      {} as AuditService,
    );
    await expect(
      service.create('member-a', {
        name: 'Cizí položka',
        categoryId: '10000000-0000-4000-8000-000000000001',
        weightGrams: 100,
        weightStatus: 'VERIFIED',
        defaultLoadType: 'CARRIED',
        defaultCriticality: 'RECOMMENDED',
        isHouseholdShared: true,
        defaultQuantity: '1',
        documents: [],
      }),
    ).rejects.toMatchObject({ code: 'EXPEDITIONS_NOT_FOUND' });
  });

  it('scopes the future search provider to the active household', async () => {
    const queryRaw = vi.fn().mockResolvedValue([]);
    const prisma = {
      $queryRaw: queryRaw,
    } as unknown as PrismaService;
    await new ExpeditionsSearchProvider(prisma).search(
      {
        userId: 'viewer-a',
        householdId: '10000000-0000-4000-8000-000000000001',
        role: 'VIEWER',
      },
      {
        normalizedQuery: 'batoh',
        requestedTypes: new Set(),
        limitPerType: 5,
      },
    );
    expect(queryRaw).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(queryRaw.mock.calls)).toContain(
      '10000000-0000-4000-8000-000000000001',
    );
  });

  it('declares snapshots, Decimal quantities and household indexes', () => {
    const schema = readFileSync(
      new URL('../prisma/schema.prisma', import.meta.url),
      'utf8',
    );
    expect(schema).toContain('model GearItem');
    expect(schema).toContain('model PackTemplateItem');
    expect(schema).toContain('model TripPackItem');
    expect(schema).toContain('quantityDecimal         Decimal');
    expect(schema).toContain('unitWeightGramsSnapshot Int');
    expect(schema).toContain('@@index([householdId, status, startsOn])');
  });

  it('uses an additive migration with database-level invariants', () => {
    const migration = readFileSync(
      new URL(
        '../prisma/migrations/20260731120000_expeditions_gear_pack_lists/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );
    expect(migration).toContain('CREATE TABLE "GearItem"');
    expect(migration).toContain('CREATE TABLE "TripPackItem"');
    expect(migration).toContain('GearItemDocument_single_cover_key');
    expect(migration).toContain('Trip_date_range_check');
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/);
  });
});
