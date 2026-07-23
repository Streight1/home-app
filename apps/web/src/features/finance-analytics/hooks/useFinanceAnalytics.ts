import { useQuery } from '@tanstack/react-query';
import { getFinanceAnalytics } from '../api/financeAnalyticsApi.js';
export const useFinanceAnalytics = () =>
  useQuery({ queryKey: ['finance-analytics'], queryFn: getFinanceAnalytics });
