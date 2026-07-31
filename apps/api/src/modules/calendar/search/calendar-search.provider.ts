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

interface CalendarSearchRow {
  id: string;
  title: string;
  description: string | null;
  locationLabel: string | null;
  location: string | null;
  participantNames: string | null;
  type: string;
  startsAt: Date | null;
  allDayStartDate: Date | null;
  updatedAt: Date;
}

@Injectable()
export class CalendarSearchProvider implements ApplicationSearchProvider {
  public readonly providerKey = 'calendar' as const;
  public readonly supportedTypes = ['calendar'] as const;

  public constructor(private readonly prisma: PrismaService) {}

  public async search(context: SearchContext, request: ModuleSearchRequest) {
    if (
      request.requestedTypes.size > 0 &&
      !request.requestedTypes.has('calendar')
    )
      return [];
    const pattern = searchLikePattern(request.normalizedQuery);
    const rows = await this.prisma.$queryRaw<CalendarSearchRow[]>(Prisma.sql`
      SELECT e."id", e."title", e."description", e."locationLabel", e."location",
        e."type"::text AS "type", e."startsAt", e."allDayStartDate", e."updatedAt",
        participants."names" AS "participantNames"
      FROM "CalendarEvent" e
      LEFT JOIN LATERAL (
        SELECT string_agg(COALESCE(u."displayName", 'Člen domácnosti'), ', ') AS "names"
        FROM "CalendarEventParticipant" p JOIN "User" u ON u."id" = p."userId"
        WHERE p."eventId" = e."id"
      ) participants ON true
      WHERE e."householdId" = ${context.householdId}::uuid
        AND e."deletedAt" IS NULL
        AND (
          homeapp_search_normalize(e."title") LIKE ${pattern}
          OR homeapp_search_normalize(e."description") LIKE ${pattern}
          OR homeapp_search_normalize(COALESCE(e."locationLabel", e."location")) LIKE ${pattern}
          OR homeapp_search_normalize(participants."names") LIKE ${pattern}
        )
      ORDER BY e."updatedAt" DESC
      LIMIT ${request.limitPerType * 4}
    `);
    return rows.map((row): ModuleSearchCandidate => {
      const eventDate = row.allDayStartDate ?? row.startsAt;
      return {
        providerKey: this.providerKey,
        entityId: row.id,
        entityKind: 'CALENDAR_EVENT',
        entityType: 'calendar',
        groupKey: 'calendar',
        title: row.title,
        subtitle: row.type,
        iconKey: 'calendar',
        ...(eventDate
          ? { dateLabel: eventDate.toISOString().slice(0, 10) }
          : {}),
        fields: compactSearchFields([
          searchField('title', 'Název', row.title, 0.84),
          searchField('description', 'Poznámka', row.description, 0.62, true),
          searchField(
            'location',
            'Místo',
            row.locationLabel ?? row.location,
            0.7,
          ),
          searchField('participants', 'Účastníci', row.participantNames, 0.62),
        ]),
        navigationTarget: {
          area: 'calendar',
          screen: 'detail',
          eventId: row.id,
        },
        updatedAt: row.updatedAt,
      };
    });
  }
}
