import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  CategorizationRule,
  CategorizationRuleInput,
} from '../types/categorization.types.js';
export const getCategorizationRules = () =>
  apiRequest<{ items: CategorizationRule[] }>('/finance/categorization-rules');
export const createCategorizationRule = (input: CategorizationRuleInput) =>
  apiRequest<{ id: string }>('/finance/categorization-rules', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const deleteCategorizationRule = (id: string) =>
  apiRequest<undefined>(`/finance/categorization-rules/${id}`, {
    method: 'DELETE',
  });
export const bulkCategorizeTransactions = (
  transactionIds: string[],
  categoryId: string,
) =>
  apiRequest<{ updatedCount: number }>(
    '/finance/categorization-rules/bulk-apply',
    {
      method: 'POST',
      body: JSON.stringify({ transactionIds, categoryId }),
    },
  );
