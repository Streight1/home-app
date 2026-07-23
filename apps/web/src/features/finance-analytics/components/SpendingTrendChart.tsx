import type { TrendPoint } from '../types/finance-analytics.types.js';

export function SpendingTrendChart({
  points,
  onSelect,
}: {
  points: TrendPoint[];
  onSelect: (point: TrendPoint) => void;
}) {
  if (!points.length)
    return (
      <p className="text-body-sm text-text-muted">Trend zatím nemá data.</p>
    );
  const values = points.flatMap((point) => [
    Number(BigInt(point.incomeMinor)),
    Number(BigInt(point.expenseMinor)),
    Number(
      BigInt(point.netMinor) < 0n
        ? -BigInt(point.netMinor)
        : BigInt(point.netMinor),
    ),
  ]);
  const maximum = Math.max(...values, 1);
  return (
    <figure>
      <svg
        className="h-40 w-full overflow-visible"
        viewBox="0 0 100 40"
        role="img"
        aria-labelledby="spending-trend-title"
      >
        <title id="spending-trend-title">Vývoj výdajů v čase</title>
        <path
          d="M0 38H100"
          className="stroke-border"
          vectorEffect="non-scaling-stroke"
        />
        <TrendLine
          points={points}
          field="expenseMinor"
          maximum={maximum}
          className="text-danger"
        />
        <TrendLine
          points={points}
          field="incomeMinor"
          maximum={maximum}
          className="text-success"
        />
        <TrendLine
          points={points}
          field="netMinor"
          maximum={maximum}
          className="text-primary"
        />
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-caption text-text-muted">
        <span>
          <i className="mr-1 inline-block size-2 rounded-full bg-danger" />
          Výdaje
        </span>
        <span>
          <i className="mr-1 inline-block size-2 rounded-full bg-success" />
          Příjmy
        </span>
        <span>
          <i className="mr-1 inline-block size-2 rounded-full bg-primary" />
          Čistý rozdíl
        </span>
      </div>
      <figcaption className="mt-2 flex justify-between text-caption text-text-muted">
        <span>{points[0]?.period}</span>
        <span>{points.at(-1)?.period}</span>
      </figcaption>
      <div className="mt-2 flex flex-wrap gap-2" aria-label="Období trendu">
        {points.map((point) => (
          <button
            key={point.period}
            type="button"
            className="min-h-11 rounded-md px-2 text-caption text-text-muted hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
            onClick={() => onSelect(point)}
          >
            {point.period}
          </button>
        ))}
      </div>
    </figure>
  );
}

function TrendLine({
  points,
  field,
  maximum,
  className,
}: {
  points: TrendPoint[];
  field: 'incomeMinor' | 'expenseMinor' | 'netMinor';
  maximum: number;
  className: string;
}) {
  const coordinates = points
    .map((point, index) => {
      const raw = BigInt(point[field]);
      const value = Number(raw < 0n ? -raw : raw);
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 38 - (value / maximum) * 34;
      return `${String(x)},${String(y)}`;
    })
    .join(' ');
  return (
    <polyline
      points={coordinates}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
      className={className}
    />
  );
}
