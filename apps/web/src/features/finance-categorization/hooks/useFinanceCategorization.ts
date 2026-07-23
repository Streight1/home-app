import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  bulkCategorizeTransactions,
  createCategorizationRule,
  deleteCategorizationRule,
  getCategorizationRules,
} from '../api/financeCategorizationApi.js';
const KEY = ['finance-categorization'] as const;
export const useCategorizationRules = () =>
  useQuery({ queryKey: KEY, queryFn: getCategorizationRules });
export function useCategorizationMutations() {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: KEY });
    await client.invalidateQueries({ queryKey: ['finance'] });
    await client.invalidateQueries({ queryKey: ['finance-analytics'] });
  };
  return {
    create: useMutation({
      mutationFn: createCategorizationRule,
      onSuccess: refresh,
    }),
    delete: useMutation({
      mutationFn: deleteCategorizationRule,
      onSuccess: refresh,
    }),
    bulk: useMutation({
      mutationFn: (input: { transactionIds: string[]; categoryId: string }) =>
        bulkCategorizeTransactions(input.transactionIds, input.categoryId),
      onSuccess: refresh,
    }),
  };
}
