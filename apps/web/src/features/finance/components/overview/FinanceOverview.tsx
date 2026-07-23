import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Landmark, Plus } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useFinanceSummary } from '../../hooks/useFinance.js';
import { formatMinorUnits } from '../../lib/money.js';
import { ExpenseCategoryBreakdown } from './ExpenseCategoryBreakdown.js';
import {
  FinancePeriodSelector,
  type FinancePeriodSelection,
} from './FinancePeriodSelector.js';

const monthPeriod = (offset: number) => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const format = (value: Date) =>
    `${String(value.getFullYear())}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  return { dateFrom: format(from), dateTo: format(to) };
};

export function FinanceOverview({
  canWrite = true,
  canManage = true,
  onAddExpense,
  onAddIncome,
  onAddAccount,
  onShowCategory,
}: {
  canWrite?: boolean;
  canManage?: boolean;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddAccount: () => void;
  onShowCategory: (categoryId: string) => void;
}) {
  const [period, setPeriod] = useState<FinancePeriodSelection>({
    kind: 'current',
  });
  const resolvedPeriod = useMemo(() => {
    if (period.kind === 'current') return monthPeriod(0);
    if (period.kind === 'previous') return monthPeriod(-1);
    return {
      ...(period.dateFrom ? { dateFrom: period.dateFrom } : {}),
      ...(period.dateTo ? { dateTo: period.dateTo } : {}),
    };
  }, [period]);
  const summary = useFinanceSummary(resolvedPeriod);
  if (summary.isPending)
    return (
      <p className="text-body-sm text-text-muted" role="status">
        Načítáme finanční přehled…
      </p>
    );
  if (summary.isError)
    return (
      <InlineAlert variant="danger">
        Finanční přehled se nepodařilo načíst.
      </InlineAlert>
    );
  if (summary.data.accounts.length === 0)
    return (
      <EmptyState
        eyebrow={<Landmark className="mx-auto size-6" aria-hidden="true" />}
        title="Začněte prvním finančním účtem"
        description="Počáteční zůstatek vytvoří výchozí bod. Žádná demo data nepřidáváme."
        action={
          canManage ? (
            <Button variant="primary" onClick={onAddAccount}>
              <Plus className="size-4" aria-hidden="true" />
              Přidat účet
            </Button>
          ) : undefined
        }
      />
    );
  const hasPeriodTransactions = summary.data.currencies.some(
    (currency) => currency.incomeMinor !== '0' || currency.expenseMinor !== '0',
  );
  return (
    <div className="grid gap-5">
      <FinancePeriodSelector value={period} onChange={setPeriod} />
      {canWrite ? (
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={onAddExpense}>
            <ArrowUpRight className="size-4" aria-hidden="true" />
            Přidat výdaj
          </Button>
          <Button onClick={onAddIncome}>
            <ArrowDownLeft className="size-4" aria-hidden="true" />
            Přidat příjem
          </Button>
        </div>
      ) : null}
      {!hasPeriodTransactions ? (
        <EmptyState
          compact
          title="Ve vybraném období nejsou transakce"
          description="Přidejte první výdaj nebo příjem, případně zvolte jiné období. Zůstatky účtů zůstávají dostupné níže."
          action={
            canWrite ? (
              <Button variant="primary" onClick={onAddExpense}>
                Přidat první výdaj
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {summary.data.currencies.map((currency) => (
          <Card key={currency.currencyCode} className="p-5">
            <p className="text-caption font-semibold uppercase tracking-wider text-text-muted">
              Aktuální období · {currency.currencyCode}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-body-sm">
              <div>
                <dt className="text-text-muted">Příjmy</dt>
                <dd className="mt-1 font-semibold tabular-nums text-success">
                  {formatMinorUnits(
                    currency.incomeMinor,
                    currency.currencyCode,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Výdaje</dt>
                <dd className="mt-1 font-semibold tabular-nums text-danger">
                  {formatMinorUnits(
                    currency.expenseMinor,
                    currency.currencyCode,
                  )}
                </dd>
              </div>
              <div className="col-span-2 border-t border-border pt-3">
                <dt className="text-text-muted">Rozdíl</dt>
                <dd className="mt-1 text-section-title font-semibold tabular-nums">
                  {formatMinorUnits(currency.netMinor, currency.currencyCode)}
                </dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
      <section aria-labelledby="account-balance-title">
        <h2
          id="account-balance-title"
          className="text-section-title font-semibold"
        >
          Zůstatky účtů
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.data.accounts
            .filter((account) => !account.archived)
            .map((account) => (
              <Card key={account.id} className="p-4">
                <p className="font-medium">{account.name}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {formatMinorUnits(
                    account.currentBalanceMinor,
                    account.currencyCode,
                  )}
                </p>
              </Card>
            ))}
        </div>
      </section>
      <ExpenseCategoryBreakdown
        currencies={summary.data.currencies}
        onShowCategory={onShowCategory}
      />
    </div>
  );
}
