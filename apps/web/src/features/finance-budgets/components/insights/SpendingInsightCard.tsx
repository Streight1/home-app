import { ArrowRight, Check, EyeOff } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { formatMinorUnits } from '../../../finance/finance.public.js';
import type { SpendingInsight } from '../../types/finance-budget.types.js';

export function SpendingInsightCard({
  insight,
  canWrite,
  pending,
  onAcknowledge,
  onDismiss,
  onShowTransactions,
}: {
  insight: SpendingInsight;
  canWrite: boolean;
  pending: boolean;
  onAcknowledge: () => void;
  onDismiss: () => void;
  onShowTransactions: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-primary-emphasis">
            {insight.severity === 'IMPORTANT'
              ? 'Důležité'
              : insight.severity === 'WARNING'
                ? 'Ke kontrole'
                : 'Zjištění'}
          </p>
          <h3 className="mt-1 text-section-title font-semibold">
            {insight.title}
          </h3>
        </div>
        {insight.presentation.primaryValueMinor ? (
          <strong className="tabular-nums">
            {formatMinorUnits(
              insight.presentation.primaryValueMinor,
              insight.currencyCode,
            )}
          </strong>
        ) : null}
      </div>
      <p className="mt-3 text-body-sm text-text-muted">{insight.explanation}</p>
      {insight.presentation.baselineMinor ? (
        <p className="mt-2 text-caption text-text-muted">
          Srovnávací medián:{' '}
          {formatMinorUnits(
            insight.presentation.baselineMinor,
            insight.currencyCode,
          )}
          {insight.presentation.comparisonPeriods
            ? ` · ${String(insight.presentation.comparisonPeriods)} období`
            : ''}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {insight.transactionFilter ? (
          <Button size="sm" onClick={onShowTransactions}>
            Zobrazit transakce
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
        {canWrite ? (
          <>
            <Button size="sm" loading={pending} onClick={onAcknowledge}>
              <Check className="size-4" aria-hidden="true" />
              Rozumím
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={onDismiss}
            >
              <EyeOff className="size-4" aria-hidden="true" />
              Skrýt
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}
