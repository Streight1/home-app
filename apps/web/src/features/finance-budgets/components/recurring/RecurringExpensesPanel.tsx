import { CalendarClock } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { formatMinorUnits } from '../../../finance/finance.public.js';
import {
  useFinanceBudgetMutations,
  useRecurringCandidates,
  useRecurringExpenses,
} from '../../hooks/useFinanceBudgets.js';
import { RecurringCandidateCard } from './RecurringCandidateCard.js';

const frequencyLabel: Record<string, string> = {
  WEEKLY: 'Týdně',
  MONTHLY: 'Měsíčně',
  QUARTERLY: 'Čtvrtletně',
  YEARLY: 'Ročně',
  IRREGULAR: 'Nepravidelně',
};

export function RecurringExpensesPanel({ canWrite }: { canWrite: boolean }) {
  const candidates = useRecurringCandidates();
  const expenses = useRecurringExpenses();
  const actions = useFinanceBudgetMutations();
  const failed = candidates.isError || expenses.isError;
  return (
    <section className="grid gap-6" aria-labelledby="recurring-heading">
      <div>
        <h2 id="recurring-heading" className="text-page-title font-semibold">
          Opakované platby
        </h2>
        <p className="mt-1 text-body-sm text-text-muted">
          Analytická evidence vzorů. Nejde o bankovní trvalé příkazy.
        </p>
      </div>
      {failed ? (
        <InlineAlert variant="danger">
          Opakované platby se nepodařilo načíst.
        </InlineAlert>
      ) : null}
      <section aria-labelledby="candidates-heading">
        <h3
          id="candidates-heading"
          className="text-section-title font-semibold"
        >
          Možné opakované platby
        </h3>
        {candidates.data?.items.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              compact
              eyebrow={
                <CalendarClock className="mx-auto size-5" aria-hidden="true" />
              }
              title="Žádné nové návrhy"
              description="Návrh vzniká až z nejméně tří podobných výdajů v pravidelném intervalu."
            />
          </div>
        ) : null}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {candidates.data?.items.map((candidate) => (
            <RecurringCandidateCard
              key={candidate.id}
              candidate={candidate}
              canWrite={canWrite}
              pending={actions.candidate.isPending}
              onConfirm={() =>
                actions.candidate.mutate({
                  id: candidate.id,
                  action: 'confirm',
                })
              }
              onDismiss={() =>
                actions.candidate.mutate({
                  id: candidate.id,
                  action: 'dismiss',
                })
              }
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="confirmed-heading">
        <h3 id="confirmed-heading" className="text-section-title font-semibold">
          Potvrzené
        </h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {expenses.data?.items.map((expense) => (
            <Card key={expense.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold">{expense.name}</h4>
                  <p className="mt-1 text-caption text-text-muted">
                    {frequencyLabel[expense.frequency]} · {expense.status} ·
                    další očekávání {expense.nextExpectedDate ?? 'neurčeno'}
                  </p>
                </div>
                <strong className="tabular-nums">
                  {formatMinorUnits(
                    expense.expectedAmountMinor,
                    expense.currencyCode,
                  )}
                </strong>
              </div>
              {canWrite ? (
                <Button
                  className="mt-4"
                  size="sm"
                  variant="ghost"
                  loading={actions.archiveRecurring.isPending}
                  onClick={() => actions.archiveRecurring.mutate(expense.id)}
                >
                  Archivovat
                </Button>
              ) : null}
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}
