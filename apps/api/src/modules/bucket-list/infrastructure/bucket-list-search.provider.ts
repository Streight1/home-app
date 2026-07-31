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

interface BucketSearchRow {
  id: string;
  title: string;
  description: string | null;
  locationLabel: string | null;
  participantNames: string | null;
  year: number;
  status: string;
  updatedAt: Date;
}

@Injectable()
export class BucketListSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'bucket-list' as const;
  public readonly supportedTypes = ['bucket-list'] as const;

  public constructor(private readonly prisma: PrismaService) {}

  public async search(context: SearchContext, request: ModuleSearchRequest) {
    if (
      request.requestedTypes.size > 0 &&
      !request.requestedTypes.has('bucket-list')
    )
      return [];
    const pattern = searchLikePattern(request.normalizedQuery);
    const rows = await this.prisma.$queryRaw<BucketSearchRow[]>(Prisma.sql`
      SELECT i."id", i."title", i."description", i."locationLabel",
        l."year", i."status"::text AS "status", i."updatedAt",
        participants."names" AS "participantNames"
      FROM "BucketListItem" i
      JOIN "YearlyBucketList" l ON l."id" = i."bucketListId"
      LEFT JOIN LATERAL (
        SELECT string_agg(COALESCE(u."displayName", 'Člen domácnosti'), ', ') AS "names"
        FROM "BucketListItemParticipant" p JOIN "User" u ON u."id" = p."userId"
        WHERE p."bucketListItemId" = i."id"
      ) participants ON true
      WHERE i."householdId" = ${context.householdId}::uuid
        AND l."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(i."title") LIKE ${pattern}
          OR homeapp_search_normalize(i."description") LIKE ${pattern}
          OR homeapp_search_normalize(i."locationLabel") LIKE ${pattern}
          OR homeapp_search_normalize(participants."names") LIKE ${pattern}
          OR l."year"::text = ${request.normalizedQuery}
        )
      ORDER BY i."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map(
      (row): ModuleSearchCandidate => ({
        providerKey: this.providerKey,
        entityId: row.id,
        entityKind: 'BUCKET_LIST_ITEM',
        entityType: 'bucket-list',
        groupKey: 'other',
        title: row.title,
        subtitle: `Bucket list ${String(row.year)}`,
        iconKey: 'sparkles',
        badges: [{ label: row.status }],
        fields: compactSearchFields([
          searchField('title', 'Název', row.title, 0.84),
          searchField('description', 'Popis', row.description, 0.66, true),
          searchField('year', 'Rok', String(row.year), 0.7),
          searchField('location', 'Místo', row.locationLabel, 0.68),
          searchField('participants', 'Účastníci', row.participantNames, 0.62),
        ]),
        navigationTarget: {
          area: 'bucket-list',
          screen: 'item',
          itemId: row.id,
        },
        updatedAt: row.updatedAt,
      }),
    );
  }
}
