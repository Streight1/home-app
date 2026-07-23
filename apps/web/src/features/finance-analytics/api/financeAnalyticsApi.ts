import { apiRequest } from '../../../lib/api/apiClient.js';
import type { FinanceAnalyticsBundle } from '../types/finance-analytics.types.js';

export async function getFinanceAnalytics(): Promise<FinanceAnalyticsBundle> {
  const [summary, categories, trend, merchants, comparison] = await Promise.all(
    [
      apiRequest<FinanceAnalyticsBundle['summary']>(
        '/finance/analytics/summary',
      ),
      apiRequest<FinanceAnalyticsBundle['categories']>(
        '/finance/analytics/category-breakdown',
      ),
      apiRequest<FinanceAnalyticsBundle['trend']>(
        '/finance/analytics/monthly-trend',
      ),
      apiRequest<FinanceAnalyticsBundle['merchants']>(
        '/finance/analytics/top-merchants',
      ),
      apiRequest<FinanceAnalyticsBundle['comparison']>(
        '/finance/analytics/category-comparison',
      ),
    ],
  );
  return { summary, categories, trend, merchants, comparison };
}
