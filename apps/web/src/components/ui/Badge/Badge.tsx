import type { ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning';

const variants: Record<BadgeVariant, string> = {
  neutral: 'border-border bg-surface-subtle text-text-muted',
  primary: 'border-primary/20 bg-primary-soft text-primary-emphasis',
  success: 'border-success/20 bg-success-soft text-success',
  warning: 'border-warning/20 bg-warning-soft text-warning',
};

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
