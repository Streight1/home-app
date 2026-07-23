import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceNavigationContext } from '../../app/workspace-navigation/workspace-navigation.context.js';
import type { WorkspaceNavigationValue } from '../../app/workspace-navigation/workspace-navigation.types.js';
import { getFinancialTransactions } from './api/financeApi.js';
import { FinanceDashboardWidget } from './components/dashboard/FinanceDashboardWidget.js';
import { DeleteFinancialTransactionDialog } from './components/forms/DeleteFinancialTransactionDialog.js';
import { FinancialTransactionForm } from './components/forms/FinancialTransactionForm.js';
import { FinancialTransferDialog } from './components/forms/FinancialTransferDialog.js';
import { TransactionDateField } from './components/forms/TransactionDateField.js';
import { FinanceOverview } from './components/overview/FinanceOverview.js';
import { FinancialTransactionList } from './components/transactions/FinancialTransactionList.js';
import type {
  FinanceListState,
  FinancialAccount,
  FinancialCategory,
  FinancialTransaction,
} from './types/finance.types.js';

const account = (
  overrides: Partial<FinancialAccount> = {},
): FinancialAccount => ({
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Domácí účet',
  type: 'CURRENT',
  currencyCode: 'CZK',
  openingBalanceMinor: '0',
  openingBalanceDate: '2026-07-01',
  currentBalanceMinor: '100000',
  description: null,
  colorToken: 'violet',
  iconKey: 'landmark',
  archivedAt: null,
  ...overrides,
});

const category = (
  kind: FinancialCategory['kind'],
  overrides: Partial<FinancialCategory> = {},
): FinancialCategory => ({
  id: `20000000-0000-4000-8000-00000000000${kind === 'EXPENSE' ? '2' : '3'}`,
  parentId: null,
  name: kind === 'EXPENSE' ? 'Potraviny' : 'Výplata',
  kind,
  colorToken: 'green',
  iconKey: 'cart',
  sortOrder: 0,
  archivedAt: null,
  ...overrides,
});

const transaction = (
  type: FinancialTransaction['type'] = 'EXPENSE',
  overrides: Partial<FinancialTransaction> = {},
): FinancialTransaction => ({
  id: `30000000-0000-4000-8000-00000000000${type === 'EXPENSE' ? '3' : type === 'INCOME' ? '4' : '5'}`,
  type,
  source: 'MANUAL',
  amount: { amountMinor: '12990', currencyCode: 'CZK' },
  bookedDate: '2026-07-16',
  counterpartyName: type.startsWith('TRANSFER') ? null : 'Místní obchod',
  counterpartyAccount: null,
  description: null,
  variableSymbol: null,
  constantSymbol: null,
  specificSymbol: null,
  note: null,
  account: {
    id: account().id,
    name: account().name,
    colorToken: 'violet',
    iconKey: 'landmark',
  },
  category:
    type === 'EXPENSE'
      ? {
          id: category('EXPENSE').id,
          name: category('EXPENSE').name,
          colorToken: 'green',
          iconKey: 'cart',
        }
      : null,
  transfer: type.startsWith('TRANSFER')
    ? {
        id: '40000000-0000-4000-8000-000000000004',
        fromAccountId: account().id,
        toAccountId: '50000000-0000-4000-8000-000000000005',
        fromAccountName: 'Domácí účet',
        toAccountName: 'Spoření',
      }
    : null,
  documents: [],
  createdAt: '2026-07-16T10:00:00.000Z',
  updatedAt: '2026-07-16T10:00:00.000Z',
  ...overrides,
});

const listState: FinanceListState = {
  page: 1,
  pageSize: 20,
  query: '',
  sortBy: 'bookedDate',
  sortDirection: 'desc',
};

const navigation: WorkspaceNavigationValue = {
  view: { area: 'dashboard' },
  navigate: vi.fn(),
  openOverlay: vi.fn(),
  closeOverlay: vi.fn(),
  clear: vi.fn(),
};

function renderClient(element: ReactElement, withNavigation = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const content = withNavigation ? (
    <WorkspaceNavigationContext.Provider value={navigation}>
      {element}
    </WorkspaceNavigationContext.Provider>
  ) : (
    element
  );
  return render(
    <QueryClientProvider client={client}>{content}</QueryClientProvider>,
  );
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('finance form contracts', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('provides a non-submitting Today shortcut for a date-only booking date', async () => {
    const change = vi.fn();
    const submit = vi.fn();
    render(
      <form onSubmit={submit}>
        <TransactionDateField
          label="Datum zaúčtování"
          value="2026-01-01"
          onChange={change}
        />
      </form>,
    );
    const today = screen.getByRole('button', { name: 'Dnes' });
    expect(today).toHaveAttribute('type', 'button');
    await userEvent.click(today);
    expect(change).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it('shows the selected account currency and filters expense categories', async () => {
    const euro = account({
      id: '60000000-0000-4000-8000-000000000006',
      name: 'Euro účet',
      currencyCode: 'EUR',
    });
    render(
      <FinancialTransactionForm
        type="expense"
        accounts={[account(), euro]}
        categories={[category('EXPENSE'), category('INCOME')]}
        documents={[]}
        loading={false}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    expect(
      screen.getByRole('option', { name: 'Potraviny' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Výplata' }),
    ).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Účet'), euro.id);
    expect(screen.getByText('Měna transakce: EUR')).toBeInTheDocument();
  });

  it('offers an explicit categorization-rule confirmation for a known merchant', async () => {
    render(
      <FinancialTransactionForm
        type="expense"
        accounts={[account()]}
        categories={[category('EXPENSE')]}
        documents={[]}
        loading={false}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Kategorie'),
      category('EXPENSE').id,
    );
    await userEvent.type(screen.getByLabelText('Komu jste platili'), 'Obchod');
    expect(
      screen.getByRole('checkbox', {
        name: /Příště podobné platby zařadit automaticky/,
      }),
    ).toBeInTheDocument();
  });

  it('filters income categories and rejects a zero amount', async () => {
    const submit = vi.fn();
    render(
      <FinancialTransactionForm
        type="income"
        accounts={[account()]}
        categories={[category('EXPENSE'), category('INCOME')]}
        documents={[]}
        loading={false}
        onSubmit={submit}
        onCancel={() => undefined}
      />,
    );
    expect(screen.getByRole('option', { name: 'Výplata' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Potraviny' }),
    ).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Částka'), '0');
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit příjem' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Částka musí být vyšší než nula.',
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it('rejects the same transfer account before any API mutation', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ items: [account()] }));
    renderClient(
      <FinancialTransferDialog open onOpenChange={() => undefined} />,
    );
    await waitFor(() =>
      expect(
        screen.getAllByRole('option', { name: /Domácí účet/ }),
      ).toHaveLength(2),
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Z účtu'),
      account().id,
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Na účet'),
      account().id,
    );
    await userEvent.type(screen.getByLabelText('Částka'), '100');
    await userEvent.click(
      screen.getByRole('button', { name: 'Provést převod' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Vyberte dva různé účty.',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a transfer between different currencies', async () => {
    const euro = account({
      id: '60000000-0000-4000-8000-000000000006',
      name: 'Euro účet',
      currencyCode: 'EUR',
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ items: [account(), euro] }),
    );
    renderClient(
      <FinancialTransferDialog open onOpenChange={() => undefined} />,
    );
    await waitFor(() =>
      expect(screen.getAllByRole('option', { name: /Euro účet/ })).toHaveLength(
        2,
      ),
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Z účtu'),
      account().id,
    );
    await userEvent.selectOptions(screen.getByLabelText('Na účet'), euro.id);
    await userEvent.type(screen.getByLabelText('Částka'), '100');
    await userEvent.click(
      screen.getByRole('button', { name: 'Provést převod' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Převod je možný jen mezi účty ve stejné měně.',
    );
  });
});

describe('finance listing, dashboard and lifecycle UI', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('labels expenses, income and transfers textually and keeps uncategorized visible', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          items: [
            transaction('EXPENSE'),
            transaction('INCOME', { category: null }),
            transaction('TRANSFER_OUT'),
          ],
          pagination: { page: 1, pageSize: 20, totalItems: 3, totalPages: 1 },
        }),
      ),
    );
    renderClient(
      <FinancialTransactionList
        state={listState}
        onStateChange={() => undefined}
        onOpen={() => undefined}
        onAddExpense={() => undefined}
      />,
    );
    expect((await screen.findAllByText('Výdaj')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Potraviny').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Příjem').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bez kategorie').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Převod z účtu/).length).toBeGreaterThan(0);
    expect(screen.getByRole('table').parentElement).toHaveClass(
      'hidden',
      'lg:block',
    );
    expect(screen.getByRole('list')).toHaveClass('lg:hidden');
  });

  it('renders CZK and EUR as separate dashboard aggregates', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        period: { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
        currencies: [
          {
            currencyCode: 'CZK',
            incomeMinor: '10000',
            expenseMinor: '2500',
            netMinor: '7500',
            previousExpenseMinor: '2000',
            expenseChangeMinor: '500',
            expenseChangeBasisPoints: 2500,
            uncategorizedCount: 0,
            topCategory: {
              categoryId: category('EXPENSE').id,
              name: 'Potraviny',
              amountMinor: '2500',
            },
            trend: [
              {
                period: '2026-07-01',
                incomeMinor: '0',
                expenseMinor: '2500',
                netMinor: '-2500',
              },
            ],
          },
          {
            currencyCode: 'EUR',
            incomeMinor: '1000',
            expenseMinor: '500',
            netMinor: '500',
            previousExpenseMinor: '600',
            expenseChangeMinor: '-100',
            expenseChangeBasisPoints: -1666,
            uncategorizedCount: 0,
            topCategory: null,
            trend: [],
          },
        ],
      }),
    );
    renderClient(<FinanceDashboardWidget />, true);
    expect(
      await screen.findByText(/Výdaje tento měsíc · CZK/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Výdaje tento měsíc · EUR/)).toBeInTheDocument();
    expect(screen.getByText('25,00 Kč')).toBeInTheDocument();
    expect(screen.getByText('5,00 €')).toBeInTheDocument();
    expect(
      screen.getByText(/Největší kategorie: Potraviny/),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/finance/analytics/dashboard'),
      expect.anything(),
    );
  });

  it('shows a truthful overview empty state without fixture balances', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        period: { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
        currencies: [],
        accounts: [],
      }),
    );
    renderClient(
      <FinanceOverview
        onAddExpense={() => undefined}
        onAddIncome={() => undefined}
        onAddAccount={() => undefined}
        onShowCategory={() => undefined}
      />,
    );
    expect(
      await screen.findByText('Začněte prvním finančním účtem'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/12 345/)).not.toBeInTheDocument();
  });

  it('disables confirmed transaction deletion while the first request is pending', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
    );
    renderClient(
      <DeleteFinancialTransactionDialog
        open
        transaction={transaction()}
        onOpenChange={() => undefined}
        onDeleted={() => undefined}
      />,
    );
    const remove = screen.getByRole('button', { name: 'Smazat transakci' });
    fireEvent.click(remove);
    fireEvent.click(remove);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(remove).toBeDisabled();
    resolveRequest?.(new Response(null, { status: 204 }));
  });

  it('keeps the visible browser URL at /app when loading filtered ledger data', async () => {
    window.history.replaceState(null, '', '/app');
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        items: [],
        pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      }),
    );
    await getFinancialTransactions({
      ...listState,
      amountFromMinor: '100',
      amountToMinor: '50000',
      documentLinked: false,
      type: 'TRANSFER_OUT',
    });
    expect(window.location.pathname).toBe('/app');
    expect(window.location.search).toBe('');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/finance/transactions?'),
      expect.objectContaining({ credentials: 'include' }),
    );
    const requestedUrl = vi.mocked(fetch).mock.calls[0]?.[0];
    const requestedHref =
      typeof requestedUrl === 'string'
        ? requestedUrl
        : requestedUrl instanceof URL
          ? requestedUrl.href
          : requestedUrl?.url;
    expect(requestedHref).toContain('amountFromMinor=100');
    expect(requestedHref).toContain('amountToMinor=50000');
    expect(requestedHref).toContain('documentLinked=false');
    expect(requestedHref).toContain('type=TRANSFER_OUT');
  });
});
