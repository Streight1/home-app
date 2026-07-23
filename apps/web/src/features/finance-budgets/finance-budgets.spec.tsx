import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseWorkspaceState } from '../../app/workspace-navigation/workspace-storage.js';
import { BudgetFormDialog } from './components/budgets/BudgetFormDialog.js';
import { BudgetProgress } from './components/budgets/BudgetProgress.js';
import { BudgetSummaryCard } from './components/budgets/BudgetSummaryCard.js';
import { BudgetsPanel } from './components/budgets/BudgetsPanel.js';
import { InsightComparisonChart } from './components/charts/InsightComparisonChart.js';
import { SpendingInsightCard } from './components/insights/SpendingInsightCard.js';
import { RecurringExpensesPanel } from './components/recurring/RecurringExpensesPanel.js';
import type {
  BudgetSummary,
  BudgetSummaryLine,
  SpendingInsight,
} from './types/finance-budget.types.js';

function renderClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.toString() : input.url;
}

function requestBody(init: RequestInit | undefined): unknown {
  return typeof init?.body === 'string' ? JSON.parse(init.body) : null;
}

const line: BudgetSummaryLine = {
  id: 'total',
  category: null,
  limitMinor: '100000',
  spentMinor: '120000',
  refundedMinor: '0',
  netSpentMinor: '120000',
  remainingMinor: '-20000',
  usedPercent: 120,
  daysElapsed: 20,
  daysRemaining: 11,
  forecast: { status: 'AVAILABLE', amountMinor: '180000', percent: 180 },
  warningThresholdPercent: 80,
  status: 'EXCEEDED',
};

const insight: SpendingInsight = {
  id: '10000000-0000-4000-8000-000000000001',
  type: 'CATEGORY_SPENDING_INCREASE',
  currencyCode: 'CZK',
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  severity: 'WARNING',
  status: 'NEW',
  title: 'Restaurace jsou výše než obvykle',
  explanation: 'Výdaje jsou vyšší než medián dvou předchozích období.',
  evidence: {},
  presentation: {
    primaryValueMinor: '485000',
    baselineMinor: '290000',
    count: null,
    comparisonPeriods: 3,
  },
  transactionFilter: { categoryId: '20000000-0000-4000-8000-000000000002' },
  firstDetectedAt: '2026-07-20T10:00:00.000Z',
  lastDetectedAt: '2026-07-22T10:00:00.000Z',
};

const summary: BudgetSummary = {
  budget: {
    id: 'budget',
    name: 'Červenec',
    currencyCode: 'CZK',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    status: 'ACTIVE',
  },
  total: line,
  allocations: [
    { ...line, id: 'food', category: { id: 'food', name: 'Potraviny' } },
  ],
  uncategorized: {
    spentMinor: '10000',
    refundedMinor: '0',
    netSpentMinor: '10000',
  },
};

describe('finance budgets UI', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('announces the exact percentage above 100 and does not hide the exceed state', () => {
    render(<BudgetProgress line={line} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '120',
    );
    expect(screen.getByText('Překročení o 20 %.')).toBeInTheDocument();
  });

  it('shows a backend presentation model and exposes safe insight actions', async () => {
    const acknowledge = vi.fn();
    const dismiss = vi.fn();
    const show = vi.fn();
    render(
      <SpendingInsightCard
        insight={insight}
        canWrite
        pending={false}
        onAcknowledge={acknowledge}
        onDismiss={dismiss}
        onShowTransactions={show}
      />,
    );
    expect(
      screen.getByText('Restaurace jsou výše než obvykle'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/4(?:\s|\u00a0|\u202f)850,00 Kč/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Rozumím' }));
    await userEvent.click(screen.getByRole('button', { name: 'Skrýt' }));
    await userEvent.click(
      screen.getByRole('button', { name: /Zobrazit transakce/ }),
    );
    expect(acknowledge).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledOnce();
    expect(show).toHaveBeenCalledOnce();
  });

  it('creates a monthly budget with exact string minor units', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      if (url.includes('/finance/categories'))
        return Promise.resolve(
          new Response(
            JSON.stringify({
              items: [
                {
                  id: 'category',
                  parentId: null,
                  name: 'Potraviny',
                  kind: 'EXPENSE',
                  colorToken: 'green',
                  iconKey: 'cart',
                  sortOrder: 0,
                  archivedAt: null,
                },
              ],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        );
      if (url.endsWith('/finance/budgets') && init?.method === 'POST')
        return Promise.resolve(
          new Response(JSON.stringify({ id: 'budget' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      return Promise.resolve(
        new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
    const close = vi.fn();
    renderClient(<BudgetFormDialog open onOpenChange={close} />);
    await userEvent.type(screen.getByLabelText('Celkový limit'), '25000');
    await userEvent.type(
      await screen.findByLabelText('Limit · Potraviny'),
      '10000',
    );
    await userEvent.clear(screen.getByLabelText('Varovat při · Potraviny (%)'));
    await userEvent.type(
      screen.getByLabelText('Varovat při · Potraviny (%)'),
      '85',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit rozpočet' }),
    );
    await waitFor(() => expect(close).toHaveBeenCalledWith(false));
    const request = vi
      .mocked(fetch)
      .mock.calls.find(([input]) =>
        requestUrl(input).endsWith('/finance/budgets'),
      );
    expect(requestBody(request?.[1])).toMatchObject({
      totalLimitMinor: '2500000',
      periodType: 'MONTHLY',
      allocations: [
        {
          categoryId: 'category',
          limitMinor: '1000000',
          warningThresholdPercent: 85,
        },
      ],
    });
  });

  it('labels forecast as an estimate and gives budget charts a text alternative', () => {
    render(<BudgetSummaryCard summary={summary} />);
    expect(screen.getAllByText(/Odhad/).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('img', {
        name: 'Srovnání čerpání, limitu a odhadu kategorií',
      }),
    ).toBeInTheDocument();
  });

  it('renders current and historical insight values without mixing currencies', () => {
    render(
      <InsightComparisonChart
        insights={[insight, { ...insight, id: 'eur', currencyCode: 'EUR' }]}
      />,
    );
    expect(
      screen.getByText(/4(?:\s|\u00a0|\u202f)850,00 Kč/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/4(?:\s|\u00a0|\u202f)850,00 €/),
    ).toBeInTheDocument();
  });

  it('distinguishes an API error from an empty budget state', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Nedostupné' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    renderClient(<BudgetsPanel canWrite />);
    expect(
      await screen.findByText('Rozpočty se nepodařilo načíst.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Zatím nemáte rozpočet')).not.toBeInTheDocument();
  });

  it('keeps viewer recurring payments read-only', async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const candidates = requestUrl(input).includes('recurring-candidates');
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: candidates
              ? [
                  {
                    id: 'candidate',
                    merchantNormalizedName: 'Streamovací služba',
                    category: null,
                    account: { id: 'account', name: 'Domácí účet' },
                    currencyCode: 'CZK',
                    typicalAmountMinor: '19900',
                    amountTolerancePercent: 15,
                    detectedFrequency: 'MONTHLY',
                    nextExpectedDate: '2026-08-01',
                    confidenceScore: 88,
                    evidenceTransactionCount: 4,
                    status: 'PROPOSED',
                  },
                ]
              : [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    renderClient(<RecurringExpensesPanel canWrite={false} />);
    expect(await screen.findByText('Streamovací služba')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Potvrdit' }),
    ).not.toBeInTheDocument();
  });

  it('allows a member to confirm or dismiss a recurring candidate', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      if (init?.method === 'POST')
        return Promise.resolve(
          new Response(JSON.stringify({ id: 'candidate' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );
      const candidates = url.includes('recurring-candidates');
      return Promise.resolve(
        new Response(
          JSON.stringify({
            items: candidates
              ? [
                  {
                    id: 'candidate',
                    merchantNormalizedName: 'Služba',
                    category: null,
                    account: { id: 'account', name: 'Účet' },
                    currencyCode: 'CZK',
                    typicalAmountMinor: '19900',
                    amountTolerancePercent: 15,
                    detectedFrequency: 'MONTHLY',
                    nextExpectedDate: '2026-08-01',
                    confidenceScore: 88,
                    evidenceTransactionCount: 4,
                    status: 'PROPOSED',
                  },
                ]
              : [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    renderClient(<RecurringExpensesPanel canWrite />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Potvrdit' }),
    );
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/finance/recurring-candidates/candidate/confirm',
        ),
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });

  it.each(['budgets', 'insights', 'recurring'] as const)(
    'accepts the %s finance workspace view without exposing it in a URL',
    (screenName) => {
      expect(
        parseWorkspaceState({ view: { area: 'finance', screen: screenName } }),
      ).toEqual({ view: { area: 'finance', screen: screenName } });
    },
  );
});
