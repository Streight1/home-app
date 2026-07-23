import { apiRequest } from '../../../lib/api/apiClient.js';
import type {
  BudgetDashboard,
  BudgetInput,
  BudgetSummary,
  FinancialBudget,
  RecurringCandidate,
  RecurringExpense,
  SpendingInsight,
} from '../types/finance-budget.types.js';

export const getBudgets = () =>
  apiRequest<{ items: FinancialBudget[] }>('/finance/budgets');
export const getBudgetSummary = (id: string) =>
  apiRequest<BudgetSummary>(`/finance/budgets/${id}/summary`);
export const createBudget = (input: BudgetInput) =>
  apiRequest<FinancialBudget>('/finance/budgets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
export const updateBudget = (id: string, input: Partial<BudgetInput>) =>
  apiRequest<FinancialBudget>(`/finance/budgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
export const archiveBudget = (id: string) =>
  apiRequest<{ id: string }>(`/finance/budgets/${id}/archive`, {
    method: 'POST',
  });
export const copyBudget = (id: string, targetMonth: string) =>
  apiRequest<FinancialBudget>(`/finance/budgets/${id}/copy`, {
    method: 'POST',
    body: JSON.stringify({ targetMonth }),
  });
export const getInsights = () =>
  apiRequest<{ items: SpendingInsight[] }>('/finance/insights');
export const refreshInsights = (currencyCode: 'CZK' | 'EUR') =>
  apiRequest<{ items: SpendingInsight[] }>('/finance/insights/refresh', {
    method: 'POST',
    body: JSON.stringify({ currencyCode }),
  });
export const setInsightStatus = (
  id: string,
  action: 'acknowledge' | 'dismiss',
) =>
  apiRequest<{ id: string }>(`/finance/insights/${id}/${action}`, {
    method: 'POST',
  });
export const getRecurringCandidates = () =>
  apiRequest<{ items: RecurringCandidate[] }>('/finance/recurring-candidates');
export const getRecurringExpenses = () =>
  apiRequest<{ items: RecurringExpense[] }>('/finance/recurring-expenses');
export const setRecurringCandidate = (
  id: string,
  action: 'confirm' | 'dismiss',
) =>
  apiRequest<{ id: string }>(`/finance/recurring-candidates/${id}/${action}`, {
    method: 'POST',
  });
export const archiveRecurringExpense = (id: string) =>
  apiRequest<{ id: string }>(`/finance/recurring-expenses/${id}/archive`, {
    method: 'POST',
  });
export const getBudgetDashboard = () =>
  apiRequest<BudgetDashboard>('/finance/budgets/dashboard');
