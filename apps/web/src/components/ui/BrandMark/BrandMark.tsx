import { House } from 'lucide-react';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="flex min-w-0 items-center gap-3"
      role={compact ? 'img' : undefined}
      aria-label={compact ? 'HomeApp' : undefined}
    >
      <span className="aurora-primary-action grid size-10 shrink-0 place-items-center rounded-lg text-primary-foreground">
        <House className="size-5" aria-hidden="true" />
      </span>
      {compact ? null : (
        <span className="min-w-0">
          <span className="block truncate text-body-sm font-semibold tracking-tight text-text">
            HomeApp
          </span>
          <span className="block truncate text-caption text-text-muted">
            Centrum domácnosti
          </span>
        </span>
      )}
    </span>
  );
}
