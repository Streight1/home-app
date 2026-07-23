import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Card } from '../../components/ui/Card/Card.js';
import { CategorySpendingChart } from '../../features/finance-analytics/components/CategorySpendingChart.js';
import { SpendingTrendChart } from '../../features/finance-analytics/components/SpendingTrendChart.js';
import type {
  CategoryBreakdownItem,
  TrendPoint,
} from '../../features/finance-analytics/types/finance-analytics.types.js';
import { CreditCardTransferReview } from '../../features/finance-imports/components/preview/CreditCardTransferReview.js';
import { ImportPreviewTable } from '../../features/finance-imports/components/preview/ImportPreviewTable.js';
import type { ImportPreviewRow } from '../../features/finance-imports/types/finance-import.types.js';
import type { FinancialAccount } from '../../features/finance/types/finance.types.js';
import { AppShell } from '../../layouts/AppShell/AppShell.js';

const navigationTarget = {
  area: 'finance' as const,
  screen: 'transactions' as const,
  filters: { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
};

const categories: CategoryBreakdownItem[] = [
  {
    categoryId: '10000000-0000-4000-8000-000000000001',
    name: 'Potraviny',
    amountMinor: '682400',
    transactionCount: 14,
    shareBasisPoints: 5355,
    navigationTarget,
  },
  {
    categoryId: '10000000-0000-4000-8000-000000000002',
    name: 'Domácnost',
    amountMinor: '371900',
    transactionCount: 5,
    shareBasisPoints: 2919,
    navigationTarget,
  },
  {
    categoryId: null,
    name: 'Nezařazeno',
    amountMinor: '219900',
    transactionCount: 3,
    shareBasisPoints: 1726,
    navigationTarget,
  },
];

const trend: TrendPoint[] = [
  ['2026-07-01', '650000', '310000', '340000'],
  ['2026-07-08', '0', '540000', '-540000'],
  ['2026-07-15', '450000', '218000', '232000'],
  ['2026-07-22', '0', '206200', '-206200'],
].map(([period, incomeMinor, expenseMinor, netMinor]) => ({
  period: period ?? '',
  incomeMinor: incomeMinor ?? '0',
  expenseMinor: expenseMinor ?? '0',
  netMinor: netMinor ?? '0',
  navigationTarget,
}));

const transferReviewRow: ImportPreviewRow = {
  id: 'row-transfer',
  rowNumber: 4,
  status: 'NEEDS_TRANSFER_REVIEW',
  bookedDate: '2026-07-16',
  amountMinor: '500000',
  currencyCode: 'CZK',
  transactionType: null,
  counterpartyName: 'Příchozí pohyb',
  description: 'Splátka nebo vrácení platby',
  categoryId: null,
  transferSourceAccountId: null,
  matchingTransactionId: null,
  userIncluded: false,
  validationErrorsJson: [],
};

const previewRows: ImportPreviewRow[] = [
  {
    id: 'row-valid',
    rowNumber: 2,
    status: 'VALID',
    bookedDate: '2026-07-14',
    amountMinor: '-129900',
    currencyCode: 'CZK',
    transactionType: 'EXPENSE',
    counterpartyName: 'Městský supermarket',
    description: 'Nákup domácnosti',
    categoryId: 'groceries',
    transferSourceAccountId: null,
    matchingTransactionId: null,
    userIncluded: true,
    validationErrorsJson: [],
  },
  {
    id: 'row-duplicate',
    rowNumber: 3,
    status: 'POSSIBLE_DUPLICATE',
    bookedDate: '2026-07-15',
    amountMinor: '-45900',
    currencyCode: 'CZK',
    transactionType: 'EXPENSE',
    counterpartyName: 'Drogerie',
    description: 'Možná již importovaná platba',
    categoryId: null,
    transferSourceAccountId: null,
    matchingTransactionId: null,
    userIncluded: false,
    validationErrorsJson: [],
  },
  transferReviewRow,
];

const sourceAccount: FinancialAccount = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Domácí účet',
  type: 'CURRENT',
  currencyCode: 'CZK',
  openingBalanceMinor: '1500000',
  openingBalanceDate: '2026-07-01',
  currentBalanceMinor: '1125000',
  description: null,
  colorToken: 'violet',
  iconKey: 'landmark',
  archivedAt: null,
};

function FixtureShell({ children }: { children: ReactNode }) {
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName="Jana Nováková"
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      {children}
    </AppShell>
  );
}

function ImportReviewScreen() {
  return (
    <FixtureShell>
      <div className="grid gap-5">
        <header>
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            Import pohybů
          </p>
          <h1 className="text-page-title font-semibold">Kontrola importu</h1>
          <p className="text-body-sm text-text-muted">
            Zkontrolujte platné řádky, možné duplicity a karetní převody.
          </p>
        </header>
        <Card className="p-4 sm:p-5">
          <ImportPreviewTable
            rows={previewRows}
            categories={[
              { id: 'groceries', name: 'Potraviny' },
              { id: 'home', name: 'Domácnost' },
            ]}
            onIncludedChange={() => undefined}
            onCategoryChange={() => undefined}
          />
        </Card>
        <Card className="p-4 sm:p-5">
          <h2 className="sr-only">Kontrola karetních pohybů</h2>
          <CreditCardTransferReview
            rows={[transferReviewRow]}
            accounts={[sourceAccount]}
            loading={false}
            onReview={() => undefined}
          />
        </Card>
      </div>
    </FixtureShell>
  );
}

function AnalyticsScreen() {
  return (
    <FixtureShell>
      <div className="grid gap-5">
        <header>
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            Finanční analytika
          </p>
          <h1 className="text-page-title font-semibold">Výdaje · CZK</h1>
          <p className="text-body-sm text-text-muted">
            Převody a splátky kreditní karty nejsou započítané jako výdaje.
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-semibold">Výdaje podle kategorií</h2>
            <div className="mt-4">
              <CategorySpendingChart
                items={categories}
                currencyCode="CZK"
                onSelect={() => undefined}
              />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">Vývoj výdajů</h2>
            <div className="mt-4">
              <SpendingTrendChart points={trend} onSelect={() => undefined} />
            </div>
          </Card>
        </div>
      </div>
    </FixtureShell>
  );
}

const meta = {
  title: 'Screens/Finance data',
  component: AnalyticsScreen,
  parameters: { route: '/app', workspace: 'finance' },
} satisfies Meta<typeof AnalyticsScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ImportReviewDark: Story = {
  parameters: { theme: 'dark' },
  render: () => <ImportReviewScreen />,
};
export const ImportReviewLight: Story = {
  parameters: { theme: 'light' },
  render: () => <ImportReviewScreen />,
};
export const AnalyticsDark: Story = { parameters: { theme: 'dark' } };
export const AnalyticsLight: Story = { parameters: { theme: 'light' } };
