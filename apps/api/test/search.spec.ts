import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  APPLICATION_SEARCH_PROVIDER_ORDER,
  APPLICATION_SEARCH_PROVIDER_TOKENS,
  APPLICATION_SEARCH_PROVIDERS_TOKEN,
  type ApplicationSearchProvider,
  type ModuleSearchCandidate,
} from '../src/common/search/application-search-provider.js';
import { isSearchNavigationTarget } from '../src/common/search/search-navigation-target.js';
import {
  normalizeSearchText,
  safeSearchSnippet,
} from '../src/common/search/search-normalization.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import { SearchRankingService } from '../src/modules/search/application/search-ranking.service.js';
import { SearchService } from '../src/modules/search/application/search.service.js';
import { SearchRequestDto } from '../src/modules/search/presentation/dto/search.dto.js';

const householdId = '10000000-0000-4000-8000-000000000001';
const entityId = '20000000-0000-4000-8000-000000000002';

function provider(
  providerKey: ApplicationSearchProvider['providerKey'],
  supportedTypes: ApplicationSearchProvider['supportedTypes'],
  search = vi.fn().mockResolvedValue([]),
): ApplicationSearchProvider {
  return { providerKey, supportedTypes, search };
}

function candidate(
  patch: Partial<ModuleSearchCandidate> = {},
): ModuleSearchCandidate {
  return {
    providerKey: 'maintenance',
    entityId,
    entityKind: 'MAINTENANCE_PLAN',
    entityType: 'maintenance',
    groupKey: 'tasks',
    title: 'Revize kotle',
    iconKey: 'maintenance',
    fields: [
      { key: 'title', label: 'Název', value: 'Revize kotle', weight: 0.84 },
    ],
    navigationTarget: {
      area: 'maintenance',
      screen: 'plan',
      planId: entityId,
    },
    updatedAt: new Date('2026-07-30T10:00:00Z'),
    ...patch,
  };
}

function serviceWith(
  overrides: Partial<
    Record<ApplicationSearchProvider['providerKey'], ApplicationSearchProvider>
  > = {},
) {
  const providers = {
    documents: provider('documents', ['documents']),
    tasks: provider('tasks', ['tasks']),
    maintenance: provider('maintenance', ['maintenance']),
    calendar: provider('calendar', ['calendar']),
    finance: provider('finance', ['finance']),
    'bucket-list': provider('bucket-list', ['bucket-list']),
    meals: provider('meals', ['recipes', 'meal-plan', 'shopping', 'pantry']),
    expeditions: provider('expeditions', ['trips', 'gear', 'pack-templates']),
    ...overrides,
  };
  const access = {
    getActiveMembership: vi
      .fn()
      .mockResolvedValue({ householdId, role: 'VIEWER' }),
  } as unknown as HouseholdAccessService;
  const service = new SearchService(
    access,
    new SearchRankingService(),
    APPLICATION_SEARCH_PROVIDER_ORDER.map(
      (providerKey) => providers[providerKey],
    ),
  );
  return { service, access };
}

describe('application search contract', () => {
  it('defines one stable public injection token per provider', () => {
    expect(Object.keys(APPLICATION_SEARCH_PROVIDER_TOKENS)).toEqual([
      'documents',
      'tasks',
      'maintenance',
      'calendar',
      'finance',
      'bucket-list',
      'meals',
      'expeditions',
    ]);
    expect(
      new Set(Object.values(APPLICATION_SEARCH_PROVIDER_TOKENS)).size,
    ).toBe(8);
    expect(APPLICATION_SEARCH_PROVIDER_ORDER).toEqual(
      Object.keys(APPLICATION_SEARCH_PROVIDER_TOKENS),
    );
    expect(APPLICATION_SEARCH_PROVIDERS_TOKEN).toBe('homeapp.search-providers');
  });

  it('normalizes Czech diacritics, casing and whitespace', () => {
    expect(normalizeSearchText('  Údržba   Krkonoše ')).toBe('udrzba krkonose');
  });

  it('validates minimum query length, provider types and limits', async () => {
    const invalid = plainToInstance(SearchRequestDto, {
      query: 'a',
      types: ['unknown'],
      limitPerType: 50,
    });
    expect((await validate(invalid)).length).toBeGreaterThanOrEqual(3);
    const valid = plainToInstance(SearchRequestDto, {
      query: 'kot',
      types: ['maintenance'],
      limitPerType: 5,
    });
    expect(await validate(valid)).toEqual([]);
  });

  it('ranks an exact title above a newer body-only match', () => {
    const ranking = new SearchRankingService();
    const exact = ranking.rank(candidate(), 'revize kotle');
    const body = ranking.rank(
      candidate({
        title: 'Nový záznam',
        fields: [
          {
            key: 'description',
            label: 'Popis',
            value: 'Obsahuje revize kotle v delším textu',
            weight: 0.66,
          },
        ],
        updatedAt: new Date('2026-07-31T10:00:00Z'),
      }),
      'revize kotle',
    );
    expect(exact?.score).toBe(1);
    expect(exact?.score ?? 0).toBeGreaterThan(body?.score ?? 0);
  });

  it('returns authorized results and an explicit partial failure without logging the query', async () => {
    const maintenanceSearch = vi.fn().mockResolvedValue([candidate()]);
    const taskSearch = vi.fn().mockRejectedValue(new Error('database timeout'));
    const { service, access } = serviceWith({
      maintenance: provider('maintenance', ['maintenance'], maintenanceSearch),
      tasks: provider('tasks', ['tasks'], taskSearch),
    });
    const warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const log = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const result = await service.search('viewer-id', {
      query: 'revize',
      types: ['tasks', 'maintenance'],
      limitPerType: 5,
    });
    expect(access.getActiveMembership).toHaveBeenCalledWith(
      'viewer-id',
      'VIEWER',
    );
    expect(maintenanceSearch).toHaveBeenCalledWith(
      expect.objectContaining({ householdId, role: 'VIEWER' }),
      expect.objectContaining({ normalizedQuery: 'revize' }),
    );
    expect(result).toMatchObject({
      partial: true,
      unavailableProviders: ['tasks'],
      groups: [
        {
          key: 'tasks',
          items: [
            {
              title: 'Revize kotle',
              navigationTarget: { area: 'maintenance', screen: 'plan' },
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain('revize');
    expect(JSON.stringify(log.mock.calls)).not.toContain('revize');
  });

  it('rejects arbitrary URLs and invalid identifiers in navigation targets', () => {
    expect(
      isSearchNavigationTarget({
        area: 'documents',
        screen: 'detail',
        documentId: entityId,
      }),
    ).toBe(true);
    expect(
      isSearchNavigationTarget({
        area: 'documents',
        screen: 'detail',
        documentId: 'https://example.test',
      }),
    ).toBe(false);
    expect(
      isSearchNavigationTarget({
        area: 'expeditions',
        screen: 'gear',
        gearItemId: entityId,
      }),
    ).toBe(true);
  });

  it('limits plain snippets', () => {
    const snippet = safeSearchSnippet(`text ${'a'.repeat(300)}`);
    expect(snippet.length).toBeLessThanOrEqual(180);
    expect(snippet).not.toContain('\n');
  });

  it('declares a POST-only no-store endpoint and safe finance projection', () => {
    const controller = readFileSync(
      new URL(
        '../src/modules/search/presentation/search.controller.ts',
        import.meta.url,
      ),
      'utf8',
    );
    const finance = readFileSync(
      new URL(
        '../src/modules/finance/search/finance-search.provider.ts',
        import.meta.url,
      ),
      'utf8',
    );
    expect(controller).toContain('@Post()');
    expect(controller).not.toContain('@Get(');
    expect(controller).toContain('private, no-store');
    expect(controller).toContain('@Throttle');
    expect(finance).not.toContain('counterpartyAccount');
    expect(finance).not.toContain('fingerprint');
    expect(finance).not.toContain('externalTransactionId');
  });

  it('adds non-destructive Czech search extensions and trigram indexes', () => {
    const migration = readFileSync(
      new URL(
        '../prisma/migrations/20260731140000_global_application_search/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );
    expect(migration).toContain('CREATE EXTENSION IF NOT EXISTS unaccent');
    expect(migration).toContain('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/i);
  });
});
