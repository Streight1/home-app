import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FinancialTransactionForm } from './components/forms/FinancialTransactionForm.js';
import { FinancialTransactionList } from './components/transactions/FinancialTransactionList.js';
import {
  addMoney,
  compareMoney,
  formatMinorUnits,
  parseMoneyInputToMinorUnits,
  subtractMoney,
} from './lib/money.js';
import type {
  FinanceListState,
  FinancialAccount,
  FinancialCategory,
  FinancialTransaction,
} from './types/finance.types.js';

const account: FinancialAccount = {
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
};
const category: FinancialCategory = {
  id: '20000000-0000-4000-8000-000000000002',
  parentId: null,
  name: 'Potraviny',
  kind: 'EXPENSE',
  colorToken: 'green',
  iconKey: 'cart',
  sortOrder: 0,
  archivedAt: null,
};
const transaction: FinancialTransaction = {
  id: '30000000-0000-4000-8000-000000000003',
  type: 'EXPENSE',
  source: 'MANUAL',
  amount: { amountMinor: '12990', currencyCode: 'CZK' },
  bookedDate: '2026-07-16',
  counterpartyName: 'Místní obchod',
  counterpartyAccount: null,
  description: 'Nákup potravin',
  variableSymbol: null,
  constantSymbol: null,
  specificSymbol: null,
  note: null,
  account: {
    id: account.id,
    name: account.name,
    colorToken: 'violet',
    iconKey: 'landmark',
  },
  category: {
    id: category.id,
    name: category.name,
    colorToken: 'green',
    iconKey: 'cart',
  },
  transfer: null,
  documents: [],
  createdAt: '2026-07-16T10:00:00.000Z',
  updatedAt: '2026-07-16T10:00:00.000Z',
};
const listState: FinanceListState = {
  page: 1,
  pageSize: 20,
  query: '',
  sortBy: 'bookedDate',
  sortDirection: 'desc',
};

function renderClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

describe('finance money helpers', () => {
  it.each([
    ['100,00', '10000'],
    ['38 990,00', '3899000'],
    ['1 249,50', '124950'],
    ['12.5', '1250'],
  ])('parses %s without floating-point arithmetic', (input, expected) => {
    expect(parseMoneyInputToMinorUnits(input)).toBe(expected);
  });

  it('formats minor units in Czech locale', () => {
    expect(formatMinorUnits('3899000', 'CZK')).toMatch(
      /38(?:\s|\u00a0|\u202f)990,00 Kč/,
    );
    expect(formatMinorUnits('1250', 'EUR')).toBe('12,50 €');
  });

  it('adds, subtracts and compares large values with bigint', () => {
    expect(addMoney('900719925474099300', '700')).toBe('900719925474100000');
    expect(subtractMoney('10000', '2500')).toBe('7500');
    expect(compareMoney('1', '2')).toBe(-1);
  });

  it('rejects exponent notation and more than two decimal places', () => {
    expect(() => parseMoneyInputToMinorUnits('1e3')).toThrow();
    expect(() => parseMoneyInputToMinorUnits('1,234')).toThrow();
  });
});

describe('finance forms and responsive listing', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()));

  it('submits exact minor units and a linked document', async () => {
    const submit = vi.fn();
    render(
      <FinancialTransactionForm
        type="expense"
        accounts={[account]}
        categories={[category]}
        documents={[
          {
            id: '40000000-0000-4000-8000-000000000004',
            type: 'RECEIPT',
            primaryLabel: 'Účtenka za nákup',
            canPreview: true,
          },
        ]}
        loading={false}
        onSubmit={submit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.type(screen.getByLabelText('Částka'), '129,90');
    await userEvent.selectOptions(
      screen.getByLabelText('Kategorie'),
      category.id,
    );
    await userEvent.click(screen.getByLabelText('Účtenka za nákup'));
    await userEvent.click(screen.getByRole('button', { name: 'Uložit výdaj' }));
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        amountMinor: '12990',
        accountId: account.id,
        categoryId: category.id,
        documentIds: ['40000000-0000-4000-8000-000000000004'],
      }),
      false,
    );
  });

  it('uses an accessible shared calendar date picker', async () => {
    render(
      <FinancialTransactionForm
        type="expense"
        accounts={[account]}
        categories={[]}
        documents={[]}
        loading={false}
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', {
        name: /července|srpna|září|října|listopadu|prosince|ledna|února|března|dubna|května|června/i,
      }),
    );
    expect(
      screen.getByRole('grid', { name: 'Kalendář: Datum zaúčtování' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Předchozí měsíc' }),
    ).toBeInTheDocument();
  });

  it('does not submit an invalid decimal amount', async () => {
    const submit = vi.fn();
    render(
      <FinancialTransactionForm
        type="expense"
        accounts={[account]}
        categories={[]}
        documents={[]}
        loading={false}
        onSubmit={submit}
        onCancel={() => undefined}
      />,
    );
    await userEvent.type(screen.getByLabelText('Částka'), '10,999');
    await userEvent.click(screen.getByRole('button', { name: 'Uložit výdaj' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Částka nemá platný formát.',
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it('offers only supported page sizes and resets page through the parent state', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            items: [transaction],
            pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    const change = vi.fn();
    renderClient(
      <FinancialTransactionList
        state={listState}
        onStateChange={change}
        onOpen={() => undefined}
        onAddExpense={() => undefined}
      />,
    );
    await screen.findAllByText('Místní obchod');
    expect(
      screen
        .getAllByRole('option')
        .filter((option) =>
          ['10', '20', '50', '100'].includes(option.textContent),
        ),
    ).toHaveLength(4);
    await userEvent.selectOptions(screen.getByLabelText('Na stránce'), '50');
    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 50 }),
    );
  });

  it('shows a truthful empty state without demo transactions', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            items: [],
            pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
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
    expect(await screen.findByText('Žádné transakce')).toBeInTheDocument();
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it('terminates loading with a real API error instead of an empty state', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            code: 'REQUEST_VALIDATION_FAILED',
            message: 'Požadavek nemá platný formát.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        ),
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
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText('Žádné transakce')).not.toBeInTheDocument();
  });
});
