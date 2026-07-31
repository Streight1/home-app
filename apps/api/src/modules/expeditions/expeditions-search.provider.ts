import { Injectable, Optional } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  compactSearchFields,
  searchField,
  searchLikePattern,
  type ApplicationSearchProvider,
  type ModuleSearchCandidate,
  type ModuleSearchRequest,
  type SearchContext,
  type SearchEntityType,
} from '../../common/search/application-search-provider.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { HouseholdAccessService } from '../households/household-access.service.js';

interface GearRow {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  categoryName: string | null;
  updatedAt: Date;
}
interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  tripType: string;
  updatedAt: Date;
}
interface TripRow {
  id: string;
  title: string;
  locationLabel: string | null;
  notes: string | null;
  tripType: string;
  startsOn: Date;
  updatedAt: Date;
}

@Injectable()
export class ExpeditionsSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'expeditions' as const;
  public readonly supportedTypes = ['trips', 'gear', 'pack-templates'] as const;

  public constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly access?: HouseholdAccessService,
  ) {}

  public search(
    context: SearchContext,
    request: ModuleSearchRequest,
  ): Promise<ModuleSearchCandidate[]>;
  public search(
    userId: string,
    query: string,
  ): Promise<ModuleSearchCandidate[]>;
  public async search(
    contextOrUserId: SearchContext | string,
    requestOrQuery: ModuleSearchRequest | string,
  ): Promise<ModuleSearchCandidate[]> {
    if (typeof contextOrUserId === 'string') {
      if (!this.access) throw new Error('Household access is not available.');
      const membership = await this.access.getActiveMembership(
        contextOrUserId,
        'VIEWER',
      );
      return this.search(
        {
          userId: contextOrUserId,
          householdId: membership.householdId,
          role: membership.role,
        },
        {
          normalizedQuery: requestOrQuery as string,
          requestedTypes: new Set(),
          limitPerType: 10,
        },
      );
    }
    const context = contextOrUserId;
    const request = requestOrQuery as ModuleSearchRequest;
    const wants = (type: SearchEntityType) =>
      request.requestedTypes.size === 0 || request.requestedTypes.has(type);
    const pattern = searchLikePattern(request.normalizedQuery);
    const [gear, templates, trips] = await Promise.all([
      wants('gear')
        ? this.searchGear(context, request, pattern)
        : Promise.resolve([]),
      wants('pack-templates')
        ? this.searchTemplates(context, request, pattern)
        : Promise.resolve([]),
      wants('trips')
        ? this.searchTrips(context, request, pattern)
        : Promise.resolve([]),
    ]);
    return [...gear, ...templates, ...trips];
  }

  private async searchGear(
    context: SearchContext,
    request: ModuleSearchRequest,
    pattern: string,
  ): Promise<ModuleSearchCandidate[]> {
    const rows = await this.prisma.$queryRaw<GearRow[]>(Prisma.sql`
      SELECT g."id", g."name", g."brand", g."model", c."name" AS "categoryName", g."updatedAt"
      FROM "GearItem" g LEFT JOIN "GearCategory" c ON c."id" = g."categoryId"
      WHERE g."householdId" = ${context.householdId}::uuid AND g."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(g."name") LIKE ${pattern}
          OR homeapp_search_normalize(g."brand") LIKE ${pattern}
          OR homeapp_search_normalize(g."model") LIKE ${pattern}
          OR homeapp_search_normalize(c."name") LIKE ${pattern}
        )
      ORDER BY g."updatedAt" DESC LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row) => {
      const identity = [row.brand, row.model].filter(Boolean).join(' · ');
      return {
        providerKey: this.providerKey,
        entityId: row.id,
        entityKind: 'GEAR_ITEM',
        entityType: 'gear',
        groupKey: 'expeditions',
        title: row.name,
        subtitle:
          identity.length > 0 ? identity : (row.categoryName ?? 'Výbava'),
        iconKey: 'backpack',
        fields: compactSearchFields([
          searchField('title', 'Název', row.name, 0.84),
          searchField('brand', 'Značka', row.brand, 0.76),
          searchField('model', 'Model', row.model, 0.78),
          searchField('category', 'Kategorie', row.categoryName, 0.7),
        ]),
        navigationTarget: {
          area: 'expeditions',
          screen: 'gear',
          gearItemId: row.id,
        },
        updatedAt: row.updatedAt,
      };
    });
  }

  private async searchTemplates(
    context: SearchContext,
    request: ModuleSearchRequest,
    pattern: string,
  ): Promise<ModuleSearchCandidate[]> {
    const rows = await this.prisma.$queryRaw<TemplateRow[]>(Prisma.sql`
      SELECT t."id", t."name", t."description", t."tripType"::text AS "tripType", t."updatedAt"
      FROM "PackTemplate" t
      WHERE t."householdId" = ${context.householdId}::uuid AND t."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(t."name") LIKE ${pattern}
          OR homeapp_search_normalize(t."description") LIKE ${pattern}
          OR homeapp_search_normalize(t."tripType"::text) LIKE ${pattern}
        )
      ORDER BY t."updatedAt" DESC LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row) => ({
      providerKey: this.providerKey,
      entityId: row.id,
      entityKind: 'PACK_TEMPLATE',
      entityType: 'pack-templates',
      groupKey: 'expeditions',
      title: row.name,
      subtitle: 'Gearlist šablona',
      iconKey: 'clipboard-list',
      fields: compactSearchFields([
        searchField('title', 'Název', row.name, 0.84),
        searchField('description', 'Popis', row.description, 0.66, true),
        searchField('trip-type', 'Typ výpravy', row.tripType, 0.7),
      ]),
      navigationTarget: {
        area: 'expeditions',
        screen: 'templates',
        templateId: row.id,
      },
      updatedAt: row.updatedAt,
    }));
  }

  private async searchTrips(
    context: SearchContext,
    request: ModuleSearchRequest,
    pattern: string,
  ): Promise<ModuleSearchCandidate[]> {
    const rows = await this.prisma.$queryRaw<TripRow[]>(Prisma.sql`
      SELECT t."id", t."title", t."locationLabel", t."notes", t."tripType"::text AS "tripType",
        t."startsOn", t."updatedAt"
      FROM "Trip" t
      WHERE t."householdId" = ${context.householdId}::uuid AND t."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(t."title") LIKE ${pattern}
          OR homeapp_search_normalize(t."locationLabel") LIKE ${pattern}
          OR homeapp_search_normalize(t."notes") LIKE ${pattern}
          OR homeapp_search_normalize(t."tripType"::text) LIKE ${pattern}
        )
      ORDER BY t."updatedAt" DESC LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row) => ({
      providerKey: this.providerKey,
      entityId: row.id,
      entityKind: 'TRIP',
      entityType: 'trips',
      groupKey: 'expeditions',
      title: row.title,
      subtitle: row.locationLabel ?? row.tripType,
      iconKey: 'mountain',
      dateLabel: row.startsOn.toISOString().slice(0, 10),
      fields: compactSearchFields([
        searchField('title', 'Název', row.title, 0.84),
        searchField('location', 'Lokalita', row.locationLabel, 0.74),
        searchField('trip-type', 'Typ výpravy', row.tripType, 0.7),
        searchField('notes', 'Poznámka', row.notes, 0.62, true),
      ]),
      navigationTarget: {
        area: 'expeditions',
        screen: 'trip',
        tripId: row.id,
      },
      updatedAt: row.updatedAt,
    }));
  }
}
