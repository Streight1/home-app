import { Copy, Plus, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  useBudgetSummary,
  useBudgets,
  useFinanceBudgetMutations,
} from '../../hooks/useFinanceBudgets.js';
import { BudgetFormDialog } from './BudgetFormDialog.js';
import { BudgetSummaryCard } from './BudgetSummaryCard.js';

export function BudgetsPanel({ canWrite }: { canWrite: boolean }) {
  const budgets = useBudgets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const summary = useBudgetSummary(selectedId);
  const copy = useFinanceBudgetMutations().copy;
  useEffect(() => {
    if (!selectedId && budgets.data?.items[0])
      setSelectedId(budgets.data.items[0].id);
  }, [budgets.data, selectedId]);
  const nextMonth = () => {
    const selected = budgets.data?.items.find(
      (budget) => budget.id === selectedId,
    );
    if (!selected) return;
    const [year = 1970, month = 1] = selected.periodStart
      .split('-')
      .map(Number);
    const target = new Date(Date.UTC(year, month, 1));
    copy.mutate({
      id: selected.id,
      targetMonth: target.toISOString().slice(0, 10),
    });
  };
  if (budgets.isError)
    return (
      <InlineAlert variant="danger">Rozpočty se nepodařilo načíst.</InlineAlert>
    );
  return (
    <section className="grid gap-5" aria-labelledby="budgets-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="budgets-heading" className="text-page-title font-semibold">
            Rozpočty
          </h2>
          <p className="mt-1 text-body-sm text-text-muted">
            Limity a odhad výdajů po jednotlivých měnách.
          </p>
        </div>
        {canWrite ? (
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Nový rozpočet
          </Button>
        ) : null}
      </div>
      {budgets.data?.items.length ? (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            className="min-w-64"
            label="Rozpočet"
            value={selectedId ?? ''}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {budgets.data.items.map((budget) => (
              <option key={budget.id} value={budget.id}>
                {budget.name} · {budget.currencyCode} · {budget.status}
              </option>
            ))}
          </Select>
          {canWrite ? (
            <Button onClick={nextMonth} loading={copy.isPending}>
              <Copy className="size-4" aria-hidden="true" />
              Použít pro další měsíc
            </Button>
          ) : null}
        </div>
      ) : null}
      {copy.isError ? (
        <InlineAlert variant="warning">{copy.error.message}</InlineAlert>
      ) : null}
      {budgets.data && budgets.data.items.length === 0 ? (
        <EmptyState
          eyebrow={<Settings2 className="mx-auto size-5" aria-hidden="true" />}
          title="Zatím nemáte rozpočet"
          description="Vytvořte měsíční limity bez změny existujících transakcí."
          action={
            canWrite ? (
              <Button variant="primary" onClick={() => setFormOpen(true)}>
                Vytvořit rozpočet
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {summary.data ? <BudgetSummaryCard summary={summary.data} /> : null}
      {summary.isError ? (
        <InlineAlert variant="danger">
          Souhrn rozpočtu se nepodařilo načíst.
        </InlineAlert>
      ) : null}
      <BudgetFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </section>
  );
}
