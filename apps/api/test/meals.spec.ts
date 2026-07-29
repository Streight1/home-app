import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import type { AuditService } from '../src/modules/audit/audit.service.js';
import type { DocumentsFacade } from '../src/modules/documents/documents.facade.js';
import type { HouseholdAccessService } from '../src/modules/households/household-access.service.js';
import { RecipesService } from '../src/modules/meals/application/recipes.service.js';
import {
  canMergeMeasurements,
  mergeMeasurements,
  scaleQuantity,
  subtractMeasurements,
} from '../src/modules/meals/shared/measurement/decimal-quantity.js';
import {
  dateOnly,
  dateOnlyString,
  normalizeCatalogName,
} from '../src/modules/meals/domain/meals.types.js';

describe('meals exact measurement domain', () => {
  it('normalizes ingredient names without cross-household global state', () => {
    expect(normalizeCatalogName('  Rajče   cherry ')).toBe('rajče cherry');
    expect(normalizeCatalogName('RAJČE CHERRY')).toBe('rajče cherry');
  });

  it('scales two portions to four exactly', () => {
    expect(scaleQuantity('250', '2', '4')).toBe('500');
  });

  it('scales four portions to three without JavaScript float drift', () => {
    expect(scaleQuantity('1.5', '4', '3')).toBe('1.125');
  });

  it('preserves quantity-less as-needed ingredients', () => {
    expect(scaleQuantity(null, '2', '6')).toBeNull();
  });

  it('merges grams and kilograms in one compatible mass dimension', () => {
    expect(
      mergeMeasurements(
        { quantity: '500', unit: 'G' },
        { quantity: '1', unit: 'KG' },
      ),
    ).toEqual({ quantity: '1.5', unit: 'KG' });
  });

  it('merges millilitres and litres in one compatible volume dimension', () => {
    expect(
      mergeMeasurements(
        { quantity: '500', unit: 'ML' },
        { quantity: '1', unit: 'L' },
      ),
    ).toEqual({ quantity: '1.5', unit: 'L' });
  });

  it('does not merge pieces with grams or as-needed quantities', () => {
    expect(
      canMergeMeasurements(
        { quantity: '2', unit: 'PIECE' },
        { quantity: '500', unit: 'G' },
      ),
    ).toBe(false);
    expect(
      canMergeMeasurements(
        { quantity: null, unit: 'AS_NEEDED' },
        { quantity: '5', unit: 'G' },
      ),
    ).toBe(false);
  });

  it('subtracts pantry stock only for compatible units', () => {
    expect(
      subtractMeasurements(
        { quantity: '1.5', unit: 'KG' },
        { quantity: '500', unit: 'G' },
      ),
    ).toEqual({
      compatible: true,
      remaining: { quantity: '1', unit: 'KG' },
    });
  });

  it('keeps date-only meal dates stable at DST boundaries', () => {
    for (const value of ['2026-03-29', '2026-10-25', '2026-07-29'])
      expect(dateOnlyString(dateOnly(value))).toBe(value);
  });
});

describe('meals access and migration boundaries', () => {
  it('requires MEMBER access before recipe mutation', async () => {
    const access = {
      getActiveMembership: vi.fn().mockRejectedValue(new Error('forbidden')),
    } as unknown as HouseholdAccessService;
    const service = new RecipesService(
      {} as PrismaService,
      access,
      {} as DocumentsFacade,
      {} as AuditService,
    );
    await expect(
      service.create('viewer', {
        title: 'Polévka',
        servings: '2',
        difficulty: 'EASY',
        isFavorite: false,
        tagIds: [],
        ingredients: [],
        steps: [],
        documents: [],
      }),
    ).rejects.toThrow('forbidden');
    expect(access.getActiveMembership).toHaveBeenCalledWith('viewer', 'MEMBER');
  });

  it('declares Decimal quantities, real foreign keys and required indexes', () => {
    const schema = readFileSync(
      new URL('../prisma/schema.prisma', import.meta.url),
      'utf8',
    );
    expect(schema).toContain('quantityDecimal Decimal?');
    expect(schema).toContain('model MealPlanParticipant');
    expect(schema).toContain('model ShoppingListItemSource');
    expect(schema).toContain('@@index([householdId, plannedFor])');
  });

  it('uses a nondestructive feature migration', () => {
    const migration = readFileSync(
      new URL(
        '../prisma/migrations/20260729160000_meals_recipes_planning_shopping_pantry/migration.sql',
        import.meta.url,
      ),
      'utf8',
    );
    expect(migration).toContain('CREATE TABLE "Recipe"');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "ShoppingList_single_open_default_key"',
    );
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/);
  });
});
