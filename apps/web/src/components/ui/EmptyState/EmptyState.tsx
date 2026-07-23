import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  eyebrow?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  eyebrow,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`aurora-header-surface rounded-lg border border-dashed border-border text-center ${compact ? 'p-5' : 'p-8 sm:p-10'}`}
    >
      {eyebrow ? <div className="mb-4">{eyebrow}</div> : null}
      <h2 className="text-section-title font-semibold tracking-tight text-text">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
