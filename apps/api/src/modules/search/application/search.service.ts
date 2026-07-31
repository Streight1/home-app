import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';
import type {
  ApplicationSearchProvider,
  SearchEntityType,
  SearchGroupKey,
} from '../../../common/search/application-search-provider.js';
import { isSearchNavigationTarget } from '../../../common/search/search-navigation-target.js';
import { normalizeSearchText } from '../../../common/search/search-normalization.js';
import { HouseholdAccessService } from '../../households/household-access.service.js';
import { BucketListSearchProvider } from '../../bucket-list/infrastructure/bucket-list-search.provider.js';
import { CalendarSearchProvider } from '../../calendar/search/calendar-search.provider.js';
import { DocumentsSearchProvider } from '../../documents/search/documents-search.provider.js';
import { ExpeditionsSearchProvider } from '../../expeditions/expeditions-search.provider.js';
import { FinanceSearchProvider } from '../../finance/search/finance-search.provider.js';
import { MaintenanceSearchProvider } from '../../maintenance/search/maintenance-search.provider.js';
import { MealsSearchProvider } from '../../meals/search/meals-search.provider.js';
import { TasksSearchProvider } from '../../tasks/search/tasks-search.provider.js';
import type {
  SearchRequestDto,
  SearchResponseDto,
} from '../presentation/dto/search.dto.js';
import { SearchRankingService } from './search-ranking.service.js';

const groupLabels: Record<SearchGroupKey, string> = {
  documents: 'Dokumenty',
  tasks: 'Úkoly a údržba',
  calendar: 'Kalendář',
  finance: 'Finance',
  meals: 'Recepty a jídlo',
  expeditions: 'Výpravy a výbava',
  other: 'Ostatní',
};

const PROVIDER_TIMEOUT_MS = 1_500;
const TOTAL_RESULT_LIMIT = 50;

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly providers: ApplicationSearchProvider[];

  public constructor(
    private readonly access: HouseholdAccessService,
    private readonly ranking: SearchRankingService,
    documents: DocumentsSearchProvider,
    tasks: TasksSearchProvider,
    maintenance: MaintenanceSearchProvider,
    calendar: CalendarSearchProvider,
    finance: FinanceSearchProvider,
    bucketList: BucketListSearchProvider,
    meals: MealsSearchProvider,
    expeditions: ExpeditionsSearchProvider,
  ) {
    this.providers = [
      documents,
      tasks,
      maintenance,
      calendar,
      finance,
      bucketList,
      meals,
      expeditions,
    ];
  }

  public async search(
    userId: string,
    input: SearchRequestDto,
  ): Promise<SearchResponseDto> {
    const startedAt = Date.now();
    const normalizedQuery = normalizeSearchText(input.query);
    if (normalizedQuery.length < 2)
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'SEARCH_INVALID_QUERY',
        'Hledaný výraz musí mít alespoň 2 znaky.',
      );
    const requestedTypes = new Set<SearchEntityType>(input.types ?? []);
    const membership = await this.access.getActiveMembership(userId, 'VIEWER');
    const selected = this.providers.filter(
      (provider) =>
        requestedTypes.size === 0 ||
        provider.supportedTypes.some((type) => requestedTypes.has(type)),
    );
    const context = {
      userId,
      householdId: membership.householdId,
      role: membership.role,
    };

    const settled = await Promise.allSettled(
      selected.map((provider) =>
        this.withTimeout(
          provider.search(context, {
            normalizedQuery,
            requestedTypes,
            limitPerType: input.limitPerType,
          }),
          PROVIDER_TIMEOUT_MS,
        ),
      ),
    );

    const unavailableProviders: string[] = [];
    const candidates = settled.flatMap((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      const providerKey = selected[index]?.providerKey ?? 'unknown';
      unavailableProviders.push(providerKey);
      this.logger.warn({
        code: 'SEARCH_PROVIDER_UNAVAILABLE',
        providerKey,
      });
      return [];
    });

    const ranked = candidates
      .filter((candidate) =>
        isSearchNavigationTarget(candidate.navigationTarget),
      )
      .map((candidate) => this.ranking.rank(candidate, normalizedQuery))
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, TOTAL_RESULT_LIMIT);

    const groups = [
      ...new Set(ranked.map(({ candidate }) => candidate.groupKey)),
    ]
      .map((groupKey) => {
        const groupItems = ranked.filter(
          ({ candidate }) => candidate.groupKey === groupKey,
        );
        const items = groupItems
          .slice(0, input.limitPerType)
          .map(({ candidate, matchedField, score, snippet }) => ({
            resultId: `${candidate.providerKey}:${candidate.entityKind}:${candidate.entityId}`,
            providerKey: candidate.providerKey,
            entityKind: candidate.entityKind,
            title: candidate.title,
            ...(candidate.subtitle ? { subtitle: candidate.subtitle } : {}),
            ...(snippet ? { snippet } : {}),
            matchedField: matchedField.label,
            iconKey: candidate.iconKey,
            ...(candidate.dateLabel ? { dateLabel: candidate.dateLabel } : {}),
            ...(candidate.badges ? { badges: candidate.badges } : {}),
            score,
            navigationTarget: candidate.navigationTarget,
          }));
        return {
          key: groupKey,
          label: groupLabels[groupKey],
          total: groupItems.length,
          items,
        };
      })
      .filter((group) => group.items.length > 0);

    const resultCount = groups.reduce(
      (sum, group) => sum + group.items.length,
      0,
    );
    this.logger.log({
      code: 'APPLICATION_SEARCH_COMPLETED',
      providerCount: selected.length,
      resultCount,
      partial: unavailableProviders.length > 0,
      durationMs: Date.now() - startedAt,
    });

    return {
      groups,
      partial: unavailableProviders.length > 0,
      unavailableProviders,
    };
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Search provider timeout')),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
