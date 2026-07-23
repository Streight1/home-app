import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gauge, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui/Button/Button.js';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState.js';
import { BudgetFormDialog } from '../../features/finance-budgets/components/budgets/BudgetFormDialog.js';
import { BudgetSummaryCard } from '../../features/finance-budgets/components/budgets/BudgetSummaryCard.js';
import { FinanceBudgetDashboardWidget } from '../../features/finance-budgets/components/dashboard/FinanceBudgetDashboardWidget.js';
import { SpendingInsightCard } from '../../features/finance-budgets/components/insights/SpendingInsightCard.js';
import { RecurringCandidateCard } from '../../features/finance-budgets/components/recurring/RecurringCandidateCard.js';
import type {
  BudgetHealth,
  BudgetSummary,
  BudgetSummaryLine,
  RecurringCandidate,
  SpendingInsight,
} from '../../features/finance-budgets/types/finance-budget.types.js';
import { AppShell } from '../../layouts/AppShell/AppShell.js';

function line(
  id: string,
  name: string | null,
  percent: number,
  status: BudgetHealth,
): BudgetSummaryLine {
  const limit = 1_000_000n;
  const spent = (limit * BigInt(percent)) / 100n;
  return {
    id,
    category: name ? { id, name } : null,
    limitMinor: limit.toString(),
    spentMinor: spent.toString(),
    refundedMinor: '0',
    netSpentMinor: spent.toString(),
    remainingMinor: (limit - spent).toString(),
    usedPercent: percent,
    daysElapsed: 16,
    daysRemaining: 15,
    forecast: {
      status: 'AVAILABLE',
      amountMinor:
        status === 'FORECAST_EXCEEDED' ? '1150000' : spent.toString(),
      percent: status === 'FORECAST_EXCEEDED' ? 115 : percent,
    },
    warningThresholdPercent: 80,
    status,
  };
}

const budgetSummary: BudgetSummary = {
  budget: {
    id: 'budget',
    name: 'Rozpočet domácnosti',
    currencyCode: 'CZK',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    status: 'ACTIVE',
  },
  total: line('total', null, 85, 'APPROACHING'),
  allocations: [
    line('safe', 'Domácnost', 40, 'SAFE'),
    line('warning', 'Potraviny', 85, 'APPROACHING'),
    line('forecast', 'Doprava', 72, 'FORECAST_EXCEEDED'),
    line('exceeded', 'Volný čas', 118, 'EXCEEDED'),
  ],
  uncategorized: {
    spentMinor: '35000',
    refundedMinor: '5000',
    netSpentMinor: '30000',
  },
};

const insightBase = {
  currencyCode: 'CZK' as const,
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  status: 'NEW' as const,
  evidence: {},
  transactionFilter: { categoryId: 'category' },
  firstDetectedAt: '2026-07-20T10:00:00.000Z',
  lastDetectedAt: '2026-07-22T10:00:00.000Z',
};
const insights: SpendingInsight[] = [
  {
    ...insightBase,
    id: 'category',
    type: 'CATEGORY_SPENDING_INCREASE',
    severity: 'WARNING',
    title: 'Restaurace jsou výše než obvykle',
    explanation:
      'Za srovnatelnou část měsíce jsou výdaje vyšší než medián tří předchozích období.',
    presentation: {
      primaryValueMinor: '485000',
      baselineMinor: '290000',
      count: null,
      comparisonPeriods: 3,
    },
  },
  {
    ...insightBase,
    id: 'merchant',
    type: 'MERCHANT_SPENDING_INCREASE',
    severity: 'INFO',
    title: 'Obchod s domácími potřebami: výdaje rostou',
    explanation:
      'Současná částka překročila absolutní i relativní práh proti srovnávacímu mediánu.',
    presentation: {
      primaryValueMinor: '310000',
      baselineMinor: '180000',
      count: 4,
      comparisonPeriods: 3,
    },
  },
  {
    ...insightBase,
    id: 'small',
    type: 'FREQUENT_SMALL_PURCHASES',
    severity: 'INFO',
    title: 'Kavárny: časté menší nákupy',
    explanation: 'Šest menších nákupů tvoří společně významnou část útraty.',
    presentation: {
      primaryValueMinor: '126000',
      baselineMinor: null,
      count: 6,
      comparisonPeriods: null,
    },
  },
];

const candidate: RecurringCandidate = {
  id: 'candidate',
  merchantNormalizedName: 'Streamovací služba',
  category: { id: 'services', name: 'Služby' },
  account: { id: 'account', name: 'Domácí účet' },
  currencyCode: 'CZK',
  typicalAmountMinor: '24900',
  amountTolerancePercent: 15,
  detectedFrequency: 'MONTHLY',
  nextExpectedDate: '2026-08-12',
  confidenceScore: 88,
  evidenceTransactionCount: 5,
  status: 'PROPOSED',
};

const dashboardFixture = {
  budgets: [
    {
      id: 'budget',
      name: 'Rozpočet domácnosti',
      currencyCode: 'CZK',
      spentMinor: '850000',
      limitMinor: '1000000',
      usedPercent: 85,
      status: 'APPROACHING',
      mostUsedCategory: {
        id: 'food',
        name: 'Potraviny',
        usedPercent: 92,
      },
    },
  ],
  newInsightCount: 3,
  recurringCandidateCount: 1,
  importantInsight: insights[0],
};

function installFinanceBudgetFixture() {
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
            id: 'user',
            email: 'jana@example.test',
            displayName: 'Jana Nováková',
            avatarUrl: null,
          },
          activeHousehold: {
            id: 'household',
            name: 'Moje domácnost',
            role: 'OWNER',
          },
        }
      : url.includes('/finance/budgets/dashboard')
        ? dashboardFixture
        : { items: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

function Shell({ children }: { children: ReactNode }) {
  installFinanceBudgetFixture();
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

function BudgetStatesScreen() {
  return (
    <Shell>
      <div className="grid gap-5">
        <header>
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            Finance
          </p>
          <h1 className="text-page-title font-semibold">Rozpočty</h1>
          <p className="text-body-sm text-text-muted">
            Čerpání a vysvětlitelný odhad v jedné měně.
          </p>
        </header>
        <BudgetSummaryCard summary={budgetSummary} />
      </div>
    </Shell>
  );
}

function EmptyBudgetScreen() {
  return (
    <Shell>
      <EmptyState
        eyebrow={<Gauge className="mx-auto size-5" aria-hidden="true" />}
        title="Zatím nemáte rozpočet"
        description="Vytvořte měsíční limity bez změny existujících transakcí."
        action={<Button variant="primary">Vytvořit rozpočet</Button>}
      />
    </Shell>
  );
}

function InsightsScreen() {
  return (
    <Shell>
      <div className="grid gap-5">
        <header>
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            Vysvětlitelná pravidla
          </p>
          <h1 className="text-page-title font-semibold">Kam mizí peníze</h1>
          <p className="text-body-sm text-text-muted">
            Zjištění nejsou finanční rada ani důkaz nehospodárného chování.
          </p>
        </header>
        <h2 className="sr-only">Aktuální zjištění</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {insights.map((insight) => (
            <SpendingInsightCard
              key={insight.id}
              insight={insight}
              canWrite
              pending={false}
              onAcknowledge={() => undefined}
              onDismiss={() => undefined}
              onShowTransactions={() => undefined}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function RecurringScreen() {
  return (
    <Shell>
      <div className="grid gap-5">
        <header>
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            Analytická evidence
          </p>
          <h1 className="text-page-title font-semibold">Opakované platby</h1>
        </header>
        <section aria-labelledby="candidate-group-title">
          <h2
            id="candidate-group-title"
            className="text-section-title font-semibold"
          >
            Možné opakované platby
          </h2>
          <h3 className="sr-only">Návrhy ke kontrole</h3>
          <div className="mt-3">
            <RecurringCandidateCard
              candidate={candidate}
              canWrite
              pending={false}
              onConfirm={() => undefined}
              onDismiss={() => undefined}
            />
          </div>
        </section>
      </div>
    </Shell>
  );
}

function DashboardScreen() {
  return (
    <Shell>
      <div className="grid grid-cols-12 gap-4">
        <FinanceBudgetDashboardWidget />
      </div>
    </Shell>
  );
}

function CreateBudgetDialogScreen() {
  return (
    <>
      <BudgetStatesScreen />
      <BudgetFormDialog open onOpenChange={() => undefined} />
    </>
  );
}

const meta = {
  title: 'Screens/Finance budgets',
  component: BudgetStatesScreen,
  parameters: { route: '/app', workspace: 'finance' },
} satisfies Meta<typeof BudgetStatesScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BudgetStatesDark: Story = { parameters: { theme: 'dark' } };
export const BudgetStatesLight: Story = { parameters: { theme: 'light' } };
export const EmptyDark: Story = {
  parameters: { theme: 'dark' },
  render: () => <EmptyBudgetScreen />,
};
export const CreateDialog: Story = {
  parameters: { theme: 'light' },
  render: () => <CreateBudgetDialogScreen />,
};
export const InsightsDark: Story = {
  parameters: { theme: 'dark' },
  render: () => <InsightsScreen />,
};
export const InsightsLight: Story = {
  parameters: { theme: 'light' },
  render: () => <InsightsScreen />,
};
export const RecurringDark: Story = {
  parameters: { theme: 'dark' },
  render: () => <RecurringScreen />,
};
export const DashboardLight: Story = {
  parameters: { theme: 'light' },
  render: () => <DashboardScreen />,
};
export const InsightEmpty: Story = {
  parameters: { theme: 'light' },
  render: () => (
    <Shell>
      <EmptyState
        eyebrow={<Sparkles className="mx-auto size-5" aria-hidden="true" />}
        title="Zatím žádné významné odchylky"
        description="Trend vyžaduje alespoň dvě dokončená srovnatelná období."
      />
    </Shell>
  ),
};
