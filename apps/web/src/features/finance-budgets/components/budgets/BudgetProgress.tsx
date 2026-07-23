import type { BudgetSummaryLine } from '../../types/finance-budget.types.js';

const statusLabel = {
  SAFE: 'V bezpečném rozsahu',
  APPROACHING: 'Blíží se limitu',
  EXCEEDED: 'Limit překročen',
  FORECAST_EXCEEDED: 'Odhad překročí limit',
  NO_LIMIT: 'Bez limitu',
} as const;

export function BudgetProgress({ line }: { line: BudgetSummaryLine }) {
  const percent = line.usedPercent ?? 0;
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-caption">
        <span className="font-medium text-text">
          {statusLabel[line.status]}
        </span>
        <span className="tabular-nums text-text-muted">
          {line.limitMinor === null
            ? 'Bez limitu'
            : `${percent.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} %`}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-hover"
        role="progressbar"
        aria-label="Čerpání rozpočtu"
        aria-valuemin={0}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={
          line.limitMinor === null
            ? 'Bez limitu'
            : `${percent.toLocaleString('cs-CZ')} procent`
        }
      >
        <span
          className={`block h-full rounded-full ${line.status === 'EXCEEDED' ? 'bg-danger' : line.status === 'APPROACHING' || line.status === 'FORECAST_EXCEEDED' ? 'bg-warning' : 'bg-primary'}`}
          style={{ width: `${String(width)}%` }}
        />
      </div>
      {percent > 100 ? (
        <p className="text-caption text-danger">
          Překročení o{' '}
          {(percent - 100).toLocaleString('cs-CZ', {
            maximumFractionDigits: 1,
          })}{' '}
          %.
        </p>
      ) : null}
    </div>
  );
}
