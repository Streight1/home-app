import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategorySpendingChart } from './components/CategorySpendingChart.js';
import { FinanceAnalyticsPanel } from './components/FinanceAnalyticsPanel.js';
import { SpendingTrendChart } from './components/SpendingTrendChart.js';
import { useFinanceAnalytics } from './hooks/useFinanceAnalytics.js';

vi.mock('./hooks/useFinanceAnalytics.js', () => ({
  useFinanceAnalytics: vi.fn(),
}));

describe('finance analytics charts', () => {
  it('renders category amount, share and transaction count accessibly', async () => {
    const onSelect = vi.fn();
    render(
      <CategorySpendingChart
        currencyCode="CZK"
        onSelect={onSelect}
        items={[
          {
            categoryId: '10000000-0000-4000-8000-000000000001',
            name: 'Potraviny',
            amountMinor: '125000',
            transactionCount: 4,
            shareBasisPoints: 6250,
            navigationTarget: {
              area: 'finance',
              screen: 'transactions',
              filters: { categoryId: '10000000-0000-4000-8000-000000000001' },
            },
          },
          {
            categoryId: null,
            name: 'Nezařazeno',
            amountMinor: '75000',
            transactionCount: 2,
            shareBasisPoints: 3750,
            navigationTarget: {
              area: 'finance',
              screen: 'transactions',
              filters: { categoryId: null },
            },
          },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Potraviny' }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: '10000000-0000-4000-8000-000000000001',
      }),
    );
    expect(screen.getByText(/62.5 procent/)).toBeInTheDocument();
    expect(screen.getByText('Nezařazeno')).toBeInTheDocument();
  });

  it('renders a deterministic trend without demo points', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <SpendingTrendChart points={[]} onSelect={onSelect} />,
    );
    expect(screen.getByText('Trend zatím nemá data.')).toBeInTheDocument();
    rerender(
      <SpendingTrendChart
        onSelect={onSelect}
        points={[
          {
            period: '2026-07-01',
            incomeMinor: '0',
            expenseMinor: '1000',
            netMinor: '-1000',
            navigationTarget: {
              area: 'finance',
              screen: 'transactions',
              filters: { dateFrom: '2026-07-01', dateTo: '2026-07-01' },
            },
          },
          {
            period: '2026-07-02',
            incomeMinor: '0',
            expenseMinor: '2000',
            netMinor: '-2000',
            navigationTarget: {
              area: 'finance',
              screen: 'transactions',
              filters: { dateFrom: '2026-07-02', dateTo: '2026-07-02' },
            },
          },
        ]}
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Vývoj výdajů v čase' }),
    ).toBeInTheDocument();
  });

  it('hands a merchant query to the transient ledger drill-down callback', async () => {
    vi.mocked(useFinanceAnalytics).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        summary: {
          currencies: [
            {
              currencyCode: 'CZK',
              expenseMinor: '125000',
              expenseChangeMinor: '0',
              uncategorizedCount: 0,
            },
          ],
        },
        categories: { currencies: [{ currencyCode: 'CZK', items: [] }] },
        trend: {
          granularity: 'DAY',
          currencies: [{ currencyCode: 'CZK', points: [] }],
        },
        merchants: {
          currencies: [
            {
              currencyCode: 'CZK',
              items: [
                {
                  merchant: 'Místní obchod',
                  amountMinor: '125000',
                  transactionCount: 2,
                  navigationTarget: {
                    area: 'finance',
                    screen: 'transactions',
                    filters: { query: 'Místní obchod' },
                  },
                },
              ],
            },
          ],
        },
        comparison: { currencies: [{ currencyCode: 'CZK', items: [] }] },
      },
    } as never);
    const onOpenTransactions = vi.fn();

    render(<FinanceAnalyticsPanel onOpenTransactions={onOpenTransactions} />);
    await userEvent.click(
      screen.getByRole('button', { name: /Místní obchod/ }),
    );

    expect(onOpenTransactions).toHaveBeenCalledWith({
      query: 'Místní obchod',
    });
  });
});
