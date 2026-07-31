import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import {
  compactSearchFields,
  searchField,
  searchLikePattern,
  type ApplicationSearchProvider,
  type ModuleSearchCandidate,
  type ModuleSearchRequest,
  type SearchContext,
} from '../../../common/search/application-search-provider.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

interface MaintenanceSearchRow {
  id: string;
  title: string;
  description: string | null;
  categoryName: string | null;
  providerName: string | null;
  locationLabel: string | null;
  status: string;
  nextDueOn: Date | null;
  updatedAt: Date;
}

@Injectable()
export class MaintenanceSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'maintenance' as const;
  public readonly supportedTypes = ['maintenance'] as const;

  public constructor(private readonly prisma: PrismaService) {}

  public async search(context: SearchContext, request: ModuleSearchRequest) {
    if (
      request.requestedTypes.size > 0 &&
      !request.requestedTypes.has('maintenance')
    )
      return [];
    const pattern = searchLikePattern(request.normalizedQuery);
    const rows = await this.prisma.$queryRaw<MaintenanceSearchRow[]>(Prisma.sql`
      SELECT p."id", p."title", p."description", c."name" AS "categoryName",
        p."providerName", p."locationLabel", p."status"::text AS "status",
        p."nextDueOn", p."updatedAt"
      FROM "MaintenancePlan" p
      LEFT JOIN "MaintenanceCategory" c ON c."id" = p."categoryId"
      WHERE p."householdId" = ${context.householdId}::uuid
        AND p."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(p."title") LIKE ${pattern}
          OR homeapp_search_normalize(p."description") LIKE ${pattern}
          OR homeapp_search_normalize(c."name") LIKE ${pattern}
          OR homeapp_search_normalize(p."providerName") LIKE ${pattern}
          OR homeapp_search_normalize(p."locationLabel") LIKE ${pattern}
        )
      ORDER BY p."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map(
      (row): ModuleSearchCandidate => ({
        providerKey: this.providerKey,
        entityId: row.id,
        entityKind: 'MAINTENANCE_PLAN',
        entityType: 'maintenance',
        groupKey: 'tasks',
        title: row.title,
        subtitle: row.categoryName ?? 'Údržba',
        iconKey: 'maintenance',
        ...(row.nextDueOn
          ? { dateLabel: row.nextDueOn.toISOString().slice(0, 10) }
          : {}),
        badges: [{ label: row.status }],
        fields: compactSearchFields([
          searchField('title', 'Název', row.title, 0.84),
          searchField('description', 'Popis', row.description, 0.66, true),
          searchField('category', 'Kategorie', row.categoryName, 0.72),
          searchField('provider', 'Dodavatel', row.providerName, 0.7),
          searchField('location', 'Místo', row.locationLabel, 0.68),
        ]),
        navigationTarget: {
          area: 'maintenance',
          screen: 'plan',
          planId: row.id,
        },
        updatedAt: row.updatedAt,
      }),
    );
  }
}
