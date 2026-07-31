import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import type {
  ApplicationSearchProvider,
  ModuleSearchCandidate,
  ModuleSearchRequest,
  SearchContext,
} from '../../../common/search/application-search-provider.js';
import {
  compactSearchFields,
  searchField,
  searchLikePattern,
} from '../../../common/search/application-search-provider.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

interface DocumentSearchRow {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  type: string;
  confirmedValue: string | null;
  metadataText: string;
  documentDate: Date | null;
  updatedAt: Date;
}

@Injectable()
export class DocumentsSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'documents' as const;
  public readonly supportedTypes = ['documents'] as const;

  public constructor(private readonly prisma: PrismaService) {}

  public async search(
    context: SearchContext,
    request: ModuleSearchRequest,
  ): Promise<ModuleSearchCandidate[]> {
    if (
      request.requestedTypes.size > 0 &&
      !request.requestedTypes.has('documents')
    )
      return [];

    const pattern = searchLikePattern(request.normalizedQuery);
    const rows = await this.prisma.$queryRaw<DocumentSearchRow[]>(Prisma.sql`
      SELECT d."id", d."title", d."description", d."notes", d."type"::text AS "type",
        accepted."rawValue" AS "confirmedValue", d."metadataJson"::text AS "metadataText",
        d."documentDate", d."updatedAt"
      FROM "Document" d
      LEFT JOIN LATERAL (
        SELECT c."rawValue"
        FROM "ExtractionFieldCandidate" c
        JOIN "ExtractionResult" r ON r."id" = c."resultId"
        JOIN "ExtractionJob" j ON j."id" = r."jobId"
        WHERE j."documentId" = d."id"
          AND c."status" IN ('ACCEPTED', 'EDITED')
          AND homeapp_search_normalize(c."rawValue") LIKE ${pattern}
        ORDER BY c."reviewedAt" DESC NULLS LAST
        LIMIT 1
      ) accepted ON true
      WHERE d."householdId" = ${context.householdId}::uuid
        AND d."status" = 'ACTIVE'
        AND d."archivedAt" IS NULL
        AND d."trashedAt" IS NULL
        AND (
          homeapp_search_normalize(d."title") LIKE ${pattern}
          OR homeapp_search_normalize(d."description") LIKE ${pattern}
          OR homeapp_search_normalize(d."notes") LIKE ${pattern}
          OR homeapp_search_normalize(d."type"::text) LIKE ${pattern}
          OR homeapp_search_normalize(d."metadataJson"::text) LIKE ${pattern}
          OR accepted."rawValue" IS NOT NULL
        )
      ORDER BY d."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);

    return rows.map((row) => ({
      providerKey: this.providerKey,
      entityId: row.id,
      entityKind: 'DOCUMENT',
      entityType: 'documents',
      groupKey: 'documents',
      title: row.title,
      subtitle: row.type,
      iconKey: 'document',
      ...(row.documentDate
        ? { dateLabel: row.documentDate.toISOString().slice(0, 10) }
        : {}),
      fields: compactSearchFields([
        searchField('title', 'Název', row.title, 0.84),
        searchField('description', 'Popis', row.description, 0.68, true),
        searchField('notes', 'Poznámka', row.notes, 0.62, true),
        searchField('type', 'Typ dokumentu', row.type, 0.66),
        searchField(
          'confirmed-metadata',
          'Potvrzená metadata',
          row.confirmedValue,
          0.72,
          true,
        ),
        searchField('metadata', 'Potvrzená metadata', row.metadataText, 0.64),
      ]),
      navigationTarget: {
        area: 'documents',
        screen: 'detail',
        documentId: row.id,
      },
      updatedAt: row.updatedAt,
    }));
  }
}
