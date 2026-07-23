import { CheckCircle2, Circle, CircleSlash2 } from 'lucide-react';
import type { BucketListProgress } from '../../types/bucket-list.types.js';

export function BucketListProgressPanel({
  progress,
}: {
  progress: BucketListProgress;
}) {
  return (
    <section
      className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm"
      aria-labelledby="bucket-list-progress-title"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            id="bucket-list-progress-title"
            className="text-caption font-semibold uppercase tracking-wider text-text-muted"
          >
            Roční pokrok
          </p>
          <strong className="mt-1 block text-page-title tabular-nums">
            {progress.percent} %
          </strong>
        </div>
        <span className="text-body-sm text-text-muted">
          {progress.completed} z {progress.total}
        </span>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-skeleton"
        role="progressbar"
        aria-label="Splněná přání"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${String(progress.percent)}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-caption text-text-muted">
        <span className="flex items-center gap-1">
          <Circle className="size-3.5" aria-hidden="true" /> {progress.planned}{' '}
          plán
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />{' '}
          {progress.completed} splněno
        </span>
        <span className="flex items-center gap-1">
          <CircleSlash2 className="size-3.5" aria-hidden="true" />{' '}
          {progress.skipped} přeskočeno
        </span>
      </div>
    </section>
  );
}
