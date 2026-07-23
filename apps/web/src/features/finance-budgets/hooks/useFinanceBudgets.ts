import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveBudget,
  archiveRecurringExpense,
  copyBudget,
  createBudget,
  getBudgetDashboard,
  getBudgetSummary,
  getBudgets,
  getInsights,
  getRecurringCandidates,
  getRecurringExpenses,
  refreshInsights,
  setInsightStatus,
  setRecurringCandidate,
  updateBudget,
} from '../api/financeBudgetsApi.js';

export const FINANCE_BUDGET_QUERY_KEY = ['finance-budgets'] as const;
export const useBudgets = () =>
  useQuery({
    queryKey: [...FINANCE_BUDGET_QUERY_KEY, 'list'],
    queryFn: getBudgets,
  });
export const useBudgetSummary = (id: string | null) =>
  useQuery({
    queryKey: [...FINANCE_BUDGET_QUERY_KEY, 'summary', id],
    queryFn: () => {
      if (!id) throw new Error('Pro načtení souhrnu chybí rozpočet.');
      return getBudgetSummary(id);
    },
    enabled: Boolean(id),
  });
export const useSpendingInsights = () =>
  useQuery({
    queryKey: [...FINANCE_BUDGET_QUERY_KEY, 'insights'],
    queryFn: getInsights,
  });
export const useRecurringCandidates = () =>
  useQuery({
    queryKey: [...FINANCE_BUDGET_QUERY_KEY, 'candidates'],
    queryFn: getRecurringCandidates,
  });
export const useRecurringExpenses = () =>
  useQuery({
    queryKey: [...FINANCE_BUDGET_QUERY_KEY, 'recurring'],
    queryFn: getRecurringExpenses,
  });
export const useBudgetDashboard = () =>
  useQuery({
    queryKey: [...FINANCE_BUDGET_QUERY_KEY, 'dashboard'],
    queryFn: getBudgetDashboard,
  });

export function useFinanceBudgetMutations() {
  const client = useQueryClient();
  const refresh = () =>
    client.invalidateQueries({ queryKey: FINANCE_BUDGET_QUERY_KEY });
  return {
    create: useMutation({ mutationFn: createBudget, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({
        id,
        input,
      }: {
        id: string;
        input: Parameters<typeof updateBudget>[1];
      }) => updateBudget(id, input),
      onSuccess: refresh,
    }),
    archive: useMutation({ mutationFn: archiveBudget, onSuccess: refresh }),
    copy: useMutation({
      mutationFn: ({ id, targetMonth }: { id: string; targetMonth: string }) =>
        copyBudget(id, targetMonth),
      onSuccess: refresh,
    }),
    refreshInsights: useMutation({
      mutationFn: refreshInsights,
      onSuccess: refresh,
    }),
    insightStatus: useMutation({
      mutationFn: ({
        id,
        action,
      }: {
        id: string;
        action: 'acknowledge' | 'dismiss';
      }) => setInsightStatus(id, action),
      onSuccess: refresh,
    }),
    candidate: useMutation({
      mutationFn: ({
        id,
        action,
      }: {
        id: string;
        action: 'confirm' | 'dismiss';
      }) => setRecurringCandidate(id, action),
      onSuccess: refresh,
    }),
    archiveRecurring: useMutation({
      mutationFn: archiveRecurringExpense,
      onSuccess: refresh,
    }),
  };
}
