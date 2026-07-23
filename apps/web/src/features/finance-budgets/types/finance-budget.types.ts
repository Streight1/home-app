import type { FinanceCurrency } from '../../finance/types/finance.types.js';

export type BudgetStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type BudgetHealth =
  | 'SAFE'
  | 'APPROACHING'
  | 'EXCEEDED'
  | 'FORECAST_EXCEEDED'
  | 'NO_LIMIT';

export interface FinancialBudget {
  id: string;
  name: string;
  currencyCode: FinanceCurrency;
  periodType: 'MONTHLY' | 'CUSTOM';
  periodStart: string;
  periodEnd: string;
  totalLimitMinor: string | null;
  status: BudgetStatus;
  archivedAt: string | null;
  allocations: {
    id: string;
    category: {
      id: string;
      name: string;
      kind: string;
      archivedAt: string | null;
    };
    limitMinor: string;
    warningThresholdPercent: number;
  }[];
}

export interface BudgetSummaryLine {
  id: string;
  category: { id: string; name: string } | null;
  limitMinor: string | null;
  spentMinor: string;
  refundedMinor: string;
  netSpentMinor: string;
  remainingMinor: string | null;
  usedPercent: number | null;
  daysElapsed: number;
  daysRemaining: number;
  forecast: {
    status: 'AVAILABLE' | 'NOT_ENOUGH_DATA';
    amountMinor: string | null;
    percent: number | null;
  };
  warningThresholdPercent: number;
  status: BudgetHealth;
}

export interface BudgetSummary {
  budget: Pick<
    FinancialBudget,
    'id' | 'name' | 'currencyCode' | 'periodStart' | 'periodEnd' | 'status'
  >;
  total: BudgetSummaryLine;
  allocations: BudgetSummaryLine[];
  uncategorized: {
    spentMinor: string;
    refundedMinor: string;
    netSpentMinor: string;
  };
}

export interface SpendingInsight {
  id: string;
  type: string;
  currencyCode: FinanceCurrency;
  periodStart: string;
  periodEnd: string;
  severity: 'INFO' | 'WARNING' | 'IMPORTANT';
  status: 'NEW' | 'ACKNOWLEDGED' | 'DISMISSED' | 'RESOLVED';
  title: string;
  explanation: string;
  evidence: Record<string, unknown>;
  presentation: {
    primaryValueMinor: string | null;
    baselineMinor: string | null;
    count: number | null;
    comparisonPeriods: number | null;
  };
  transactionFilter: { categoryId?: string; query?: string } | null;
  firstDetectedAt: string;
  lastDetectedAt: string;
}

export interface RecurringCandidate {
  id: string;
  merchantNormalizedName: string;
  category: { id: string; name: string } | null;
  account: { id: string; name: string };
  currencyCode: FinanceCurrency;
  typicalAmountMinor: string;
  amountTolerancePercent: number;
  detectedFrequency: string;
  nextExpectedDate: string | null;
  confidenceScore: number;
  evidenceTransactionCount: number;
  status: string;
}

export interface RecurringExpense {
  id: string;
  name: string;
  merchantNormalizedName: string;
  category: { id: string; name: string } | null;
  account: { id: string; name: string } | null;
  currencyCode: FinanceCurrency;
  expectedAmountMinor: string;
  amountTolerancePercent: number;
  frequency: string;
  nextExpectedDate: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
}

export interface BudgetDashboard {
  budgets: {
    id: string;
    name: string;
    currencyCode: FinanceCurrency;
    spentMinor: string;
    limitMinor: string | null;
    usedPercent: number | null;
    status: BudgetHealth;
    mostUsedCategory: {
      id: string | null;
      name: string;
      usedPercent: number | null;
    } | null;
  }[];
  newInsightCount: number;
  recurringCandidateCount: number;
  importantInsight: SpendingInsight | null;
}

export interface BudgetInput {
  name: string;
  currencyCode: FinanceCurrency;
  periodType: 'MONTHLY' | 'CUSTOM';
  periodStart: string;
  periodEnd: string;
  totalLimitMinor?: string;
  status: 'DRAFT' | 'ACTIVE';
  allocations: {
    categoryId: string;
    limitMinor: string;
    warningThresholdPercent: number;
  }[];
}
