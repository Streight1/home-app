import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from '../../layouts/AppShell/AppShell.js';
import { FinanceOverview } from '../../features/finance/components/overview/FinanceOverview.js';
import { FinancialTransactionList } from '../../features/finance/components/transactions/FinancialTransactionList.js';
import { FinancialTransactionForm } from '../../features/finance/components/forms/FinancialTransactionForm.js';
import { Dialog } from '../../components/ui/Dialog/Dialog.js';
import type {
  FinanceListState,
  FinancialAccount,
  FinancialCategory,
  FinancialTransaction,
} from '../../features/finance/types/finance.types.js';

const account: FinancialAccount = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Domácí účet',
  type: 'CURRENT',
  currencyCode: 'CZK',
  openingBalanceMinor: '1250000',
  openingBalanceDate: '2026-07-01',
  currentBalanceMinor: '1187010',
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
  amount: { amountMinor: '62990', currencyCode: 'CZK' },
  bookedDate: '2026-07-16',
  counterpartyName: 'Místní obchod',
  counterpartyAccount: null,
  description: 'Týdenní nákup',
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

function installFinanceFixture() {
  window.fetch = (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const body = url.includes('/auth/me')
      ? {
          user: {
            id: '20000000-0000-4000-8000-000000000001',
            email: 'jana@example.test',
            displayName: 'Jana Nováková',
            avatarUrl: null,
          },
          activeHousehold: {
            id: '10000000-0000-4000-8000-000000000001',
            name: 'Moje domácnost',
            role: 'OWNER',
          },
        }
      : url.includes('/finance/transactions')
        ? {
            items: [transaction],
            pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
          }
        : url.includes('/finance/summary')
          ? {
              period: { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
              currencies: [
                {
                  currencyCode: 'CZK',
                  incomeMinor: '0',
                  expenseMinor: '62990',
                  netMinor: '-62990',
                  uncategorizedExpenseCount: 0,
                  topExpenseCategories: [
                    {
                      categoryId: category.id,
                      name: category.name,
                      amountMinor: '62990',
                      shareBasisPoints: 10_000,
                    },
                  ],
                },
              ],
              accounts: [
                {
                  id: account.id,
                  name: account.name,
                  currencyCode: 'CZK',
                  currentBalanceMinor: account.currentBalanceMinor,
                  archived: false,
                },
              ],
            }
          : { items: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

function FinanceScreen() {
  installFinanceFixture();
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid gap-6">
        <header className="aurora-header-surface rounded-lg border border-border p-5 sm:p-6">
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            Domácí finance
          </p>
          <h1 className="mt-1 text-page-title font-semibold">Finance</h1>
          <p className="mt-2 text-body-sm text-text-muted">
            Přesný ruční ledger bez napojení na banku.
          </p>
        </header>
        <FinanceOverview
          onAddExpense={() => undefined}
          onAddIncome={() => undefined}
          onAddAccount={() => undefined}
          onShowCategory={() => undefined}
        />
        <FinancialTransactionList
          state={listState}
          onStateChange={() => undefined}
          onOpen={() => undefined}
          onAddExpense={() => undefined}
        />
      </div>
    </AppShell>
  );
}

const meta = {
  title: 'Screens/Finance',
  component: FinanceScreen,
  parameters: { route: '/app', workspace: 'finance' },
} satisfies Meta<typeof FinanceScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const LedgerLight: Story = {
  parameters: { theme: 'light', workspace: 'finance' },
};
export const LedgerDark: Story = {
  parameters: { theme: 'dark', workspace: 'finance' },
};
export const ExpenseDialog: Story = {
  parameters: { theme: 'dark', workspace: 'finance' },
  render: () => (
    <>
      <FinanceScreen />
      <Dialog
        open
        onOpenChange={() => undefined}
        title="Nový výdaj"
        size="lg"
        mobileFullScreen
      >
        <FinancialTransactionForm
          type="expense"
          accounts={[account]}
          categories={[category]}
          documents={[]}
          loading={false}
          onSubmit={() => undefined}
          onCancel={() => undefined}
        />
      </Dialog>
    </>
  ),
};
