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
import { serializeDateOnly } from '../../../common/time/date-only.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

interface FinanceSearchRow {
  id: string;
  counterpartyName: string | null;
  merchantNormalizedName: string | null;
  description: string | null;
  note: string | null;
  accountName: string;
  categoryName: string | null;
  type: string;
  bookedDate: Date;
  updatedAt: Date;
}

@Injectable()
export class FinanceSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'finance' as const;
  public readonly supportedTypes = ['finance'] as const;

  public constructor(private readonly prisma: PrismaService) {}

  public async search(context: SearchContext, request: ModuleSearchRequest) {
    if (
      request.requestedTypes.size > 0 &&
      !request.requestedTypes.has('finance')
    )
      return [];
    const pattern = searchLikePattern(request.normalizedQuery);
    const rows = await this.prisma.$queryRaw<FinanceSearchRow[]>(Prisma.sql`
      SELECT t."id", t."counterpartyName", t."merchantNormalizedName", t."description",
        t."note", a."name" AS "accountName", c."name" AS "categoryName",
        t."type"::text AS "type", t."bookedDate", t."updatedAt"
      FROM "FinancialTransaction" t
      JOIN "FinancialAccount" a ON a."id" = t."accountId"
      LEFT JOIN "FinancialCategory" c ON c."id" = t."categoryId"
      WHERE t."householdId" = ${context.householdId}::uuid
        AND t."deletedAt" IS NULL
        AND (
          homeapp_search_normalize(t."counterpartyName") LIKE ${pattern}
          OR homeapp_search_normalize(t."merchantNormalizedName") LIKE ${pattern}
          OR homeapp_search_normalize(t."description") LIKE ${pattern}
          OR homeapp_search_normalize(t."note") LIKE ${pattern}
          OR homeapp_search_normalize(a."name") LIKE ${pattern}
          OR homeapp_search_normalize(c."name") LIKE ${pattern}
        )
      ORDER BY t."bookedDate" DESC, t."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map(
      (row): ModuleSearchCandidate => ({
        providerKey: this.providerKey,
        entityId: row.id,
        entityKind: 'FINANCIAL_TRANSACTION',
        entityType: 'finance',
        groupKey: 'finance',
        title:
          row.counterpartyName ??
          row.merchantNormalizedName ??
          row.description ??
          'Finanční pohyb',
        subtitle: row.categoryName ?? row.accountName,
        iconKey: 'finance',
        dateLabel: serializeDateOnly(row.bookedDate),
        badges: [{ label: row.type }],
        fields: compactSearchFields([
          searchField(
            'title',
            'Protistrana',
            row.counterpartyName ?? row.merchantNormalizedName,
            0.84,
          ),
          searchField('description', 'Popis', row.description, 0.7, true),
          searchField('category', 'Kategorie', row.categoryName, 0.72),
          searchField('account', 'Účet', row.accountName, 0.68),
          searchField('note', 'Poznámka', row.note, 0.62, true),
        ]),
        navigationTarget: {
          area: 'finance',
          screen: 'detail',
          transactionId: row.id,
        },
        updatedAt: row.updatedAt,
      }),
    );
  }
}
