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

interface TaskSearchRow {
  id: string;
  title: string;
  description: string | null;
  locationLabel: string | null;
  categoryName: string | null;
  participantNames: string | null;
  status: string;
  dueDate: Date | null;
  updatedAt: Date;
}

@Injectable()
export class TasksSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'tasks' as const;
  public readonly supportedTypes = ['tasks'] as const;

  public constructor(private readonly prisma: PrismaService) {}

  public async search(context: SearchContext, request: ModuleSearchRequest) {
    if (request.requestedTypes.size > 0 && !request.requestedTypes.has('tasks'))
      return [];
    const pattern = searchLikePattern(request.normalizedQuery);
    const rows = await this.prisma.$queryRaw<TaskSearchRow[]>(Prisma.sql`
      SELECT t."id", t."title", t."description", t."locationLabel",
        c."name" AS "categoryName", t."status"::text AS "status", t."dueDate", t."updatedAt",
        participants."names" AS "participantNames"
      FROM "AgendaTask" t
      LEFT JOIN "TaskCategory" c ON c."id" = t."categoryId"
      LEFT JOIN LATERAL (
        SELECT string_agg(COALESCE(u."displayName", 'Člen domácnosti'), ', ') AS "names"
        FROM "TaskParticipant" p JOIN "User" u ON u."id" = p."userId"
        WHERE p."taskId" = t."id"
      ) participants ON true
      WHERE t."householdId" = ${context.householdId}::uuid
        AND t."archivedAt" IS NULL
        AND (
          homeapp_search_normalize(t."title") LIKE ${pattern}
          OR homeapp_search_normalize(t."description") LIKE ${pattern}
          OR homeapp_search_normalize(t."locationLabel") LIKE ${pattern}
          OR homeapp_search_normalize(c."name") LIKE ${pattern}
          OR homeapp_search_normalize(participants."names") LIKE ${pattern}
        )
      ORDER BY t."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map(
      (row): ModuleSearchCandidate => ({
        providerKey: this.providerKey,
        entityId: row.id,
        entityKind: 'TASK',
        entityType: 'tasks',
        groupKey: 'tasks',
        title: row.title,
        subtitle: row.categoryName ?? 'Úkol',
        iconKey: 'task',
        ...(row.dueDate
          ? { dateLabel: row.dueDate.toISOString().slice(0, 10) }
          : {}),
        badges: [{ label: row.status }],
        fields: compactSearchFields([
          searchField('title', 'Název', row.title, 0.84),
          searchField('description', 'Popis', row.description, 0.66, true),
          searchField('category', 'Kategorie', row.categoryName, 0.72),
          searchField('location', 'Místo', row.locationLabel, 0.7),
          searchField('participants', 'Účastníci', row.participantNames, 0.62),
        ]),
        navigationTarget: { area: 'tasks', screen: 'detail', taskId: row.id },
        updatedAt: row.updatedAt,
      }),
    );
  }
}
