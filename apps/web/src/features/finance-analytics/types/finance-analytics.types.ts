export interface AnalyticsCurrencySummary {
  currencyCode: 'CZK' | 'EUR';
  incomeMinor: string;
  expenseMinor: string;
  netMinor: string;
  previousExpenseMinor: string;
  expenseChangeMinor: string;
  expenseChangeBasisPoints: number | null;
  uncategorizedCount: number;
}
export interface FinanceAnalyticsNavigationTarget {
  area: 'finance';
  screen: 'transactions';
  filters: {
    query?: string;
    categoryId?: string | null;
    dateFrom?: string;
    dateTo?: string;
  };
}
export interface CategoryBreakdownItem {
  categoryId: string | null;
  name: string;
  amountMinor: string;
  transactionCount: number;
  shareBasisPoints: number;
  navigationTarget: FinanceAnalyticsNavigationTarget;
}
export interface TrendPoint {
  period: string;
  incomeMinor: string;
  expenseMinor: string;
  netMinor: string;
  navigationTarget: FinanceAnalyticsNavigationTarget;
}
export interface FinanceAnalyticsBundle {
  summary: { currencies: AnalyticsCurrencySummary[] };
  categories: {
    currencies: { currencyCode: string; items: CategoryBreakdownItem[] }[];
  };
  trend: {
    granularity: 'DAY' | 'MONTH';
    currencies: { currencyCode: string; points: TrendPoint[] }[];
  };
  merchants: {
    currencies: {
      currencyCode: string;
      items: {
        merchant: string;
        amountMinor: string;
        transactionCount: number;
        navigationTarget: FinanceAnalyticsNavigationTarget;
      }[];
    }[];
  };
  comparison: {
    currencies: {
      currencyCode: string;
      items: (CategoryBreakdownItem & {
        previousAmountMinor: string;
        differenceMinor: string;
        changeBasisPoints: number | null;
      })[];
    }[];
  };
}
