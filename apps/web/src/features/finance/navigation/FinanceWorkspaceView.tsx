import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Button } from '../../../components/ui/Button/Button.js';
import type { HouseholdRole } from '../../tasks/types/task.types.js';
import { FinancialAccountsPanel } from '../components/accounts/FinancialAccountsPanel.js';
import { FinancialCategoriesPanel } from '../components/categories/FinancialCategoriesPanel.js';
import { FinanceImportWorkspaceView } from '../../finance-imports/workspace/FinanceImportWorkspaceView.js';
import { FinanceAnalyticsPanel } from '../../finance-analytics/components/FinanceAnalyticsPanel.js';
import { CategorizationRulesPanel } from '../../finance-categorization/components/CategorizationRulesPanel.js';
import { BudgetsPanel } from '../../finance-budgets/components/budgets/BudgetsPanel.js';
import { SpendingInsightsPanel } from '../../finance-budgets/components/insights/SpendingInsightsPanel.js';
import { RecurringExpensesPanel } from '../../finance-budgets/components/recurring/RecurringExpensesPanel.js';
import { FinancialAccountDialog } from '../components/forms/FinancialAccountDialog.js';
import { FinancialCategoryDialog } from '../components/forms/FinancialCategoryDialog.js';
import { FinancialTransactionDialog } from '../components/forms/FinancialTransactionDialog.js';
import { FinancialTransferDialog } from '../components/forms/FinancialTransferDialog.js';
import { FinanceOverview } from '../components/overview/FinanceOverview.js';
import { FinancialTransactionDetail } from '../components/transactions/FinancialTransactionDetail.js';
import { FinancialTransactionList } from '../components/transactions/FinancialTransactionList.js';
import type { FinanceListState } from '../types/finance.types.js';

const initialListState: FinanceListState = {
  page: 1,
  pageSize: 20,
  query: '',
  sortBy: 'bookedDate',
  sortDirection: 'desc',
};
type DialogKind =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'account'
  | 'category'
  | null;

export function FinanceWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'finance' }>;
  role: HouseholdRole;
}) {
  const workspace = useWorkspaceNavigation();
  const [listState, setListState] = useState(initialListState);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const canWrite = role !== 'VIEWER';
  const canManage = role === 'OWNER' || role === 'ADMIN';
  useEffect(() => {
    if (view.screen === 'transactions' && view.filters)
      setListState((current) => ({ ...current, ...view.filters, page: 1 }));
  }, [view]);
  if (view.screen === 'detail')
    return (
      <FinancialTransactionDetail
        id={view.transactionId}
        canEdit={canWrite}
        onBack={() =>
          workspace.navigate({ area: 'finance', screen: 'transactions' })
        }
      />
    );
  const tabs = [
    { screen: 'overview', label: 'Přehled' },
    { screen: 'transactions', label: 'Transakce' },
    { screen: 'budgets', label: 'Rozpočty' },
    { screen: 'insights', label: 'Kam mizí peníze' },
    { screen: 'recurring', label: 'Opakované platby' },
    { screen: 'accounts', label: 'Účty' },
    { screen: 'categories', label: 'Kategorie' },
    { screen: 'imports', label: 'Importy' },
    { screen: 'rules', label: 'Pravidla' },
    { screen: 'analytics', label: 'Analytika' },
  ] as const;
  return (
    <div className="grid gap-6">
      <header className="aurora-header-surface rounded-lg border border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
              Domácí finance
            </p>
            <h1 className="mt-1 text-page-title font-semibold">Finance</h1>
            <p className="mt-2 text-body-sm text-text-muted">
              Přesný ruční ledger bez napojení na banku.
            </p>
          </div>
          {canWrite ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => setDialog('expense')}>
                <ArrowUpRight className="size-4" aria-hidden="true" />
                Výdaj
              </Button>
              <Button onClick={() => setDialog('income')}>
                <ArrowDownLeft className="size-4" aria-hidden="true" />
                Příjem
              </Button>
              <Button onClick={() => setDialog('transfer')}>
                <ArrowLeftRight className="size-4" aria-hidden="true" />
                Převod
              </Button>
            </div>
          ) : null}
        </div>
        <nav
          className="mt-5 flex gap-1 overflow-x-auto"
          aria-label="Sekce financí"
        >
          {tabs.map((tab) => (
            <button
              key={tab.screen}
              className={`min-h-11 shrink-0 rounded-md px-3 text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-focus ${view.screen === tab.screen ? 'bg-selected-surface text-primary-emphasis' : 'text-text-muted hover:bg-surface-hover'}`}
              onClick={() =>
                workspace.navigate({ area: 'finance', screen: tab.screen })
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      {view.screen === 'overview' ? (
        <FinanceOverview
          canWrite={canWrite}
          canManage={canManage}
          onAddExpense={() => setDialog('expense')}
          onAddIncome={() => setDialog('income')}
          onAddAccount={() => setDialog('account')}
          onShowCategory={(categoryId) => {
            setListState((current) => ({
              ...current,
              categoryId,
              page: 1,
            }));
            workspace.navigate({ area: 'finance', screen: 'transactions' });
          }}
        />
      ) : null}
      {view.screen === 'transactions' ? (
        <FinancialTransactionList
          canWrite={canWrite}
          state={listState}
          onStateChange={setListState}
          onOpen={(transactionId) =>
            workspace.navigate({
              area: 'finance',
              screen: 'detail',
              transactionId,
            })
          }
          onAddExpense={() => setDialog('expense')}
        />
      ) : null}
      {view.screen === 'accounts' ? (
        <FinancialAccountsPanel
          canManage={canManage}
          onAdd={() => setDialog('account')}
        />
      ) : null}
      {view.screen === 'categories' ? (
        <FinancialCategoriesPanel
          canManage={canManage}
          onAdd={() => setDialog('category')}
        />
      ) : null}
      {view.screen === 'imports' ? (
        <FinanceImportWorkspaceView canWrite={canWrite} />
      ) : null}
      {view.screen === 'rules' ? (
        <CategorizationRulesPanel canWrite={canWrite} />
      ) : null}
      {view.screen === 'analytics' ? <FinanceAnalyticsPanel /> : null}
      {view.screen === 'budgets' ? <BudgetsPanel canWrite={canWrite} /> : null}
      {view.screen === 'insights' ? (
        <SpendingInsightsPanel canWrite={canWrite} />
      ) : null}
      {view.screen === 'recurring' ? (
        <RecurringExpensesPanel canWrite={canWrite} />
      ) : null}
      {dialog === 'expense' || dialog === 'income' ? (
        <FinancialTransactionDialog
          open
          type={dialog}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      <FinancialTransferDialog
        open={dialog === 'transfer'}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <FinancialAccountDialog
        open={dialog === 'account'}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <FinancialCategoryDialog
        open={dialog === 'category'}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </div>
  );
}
