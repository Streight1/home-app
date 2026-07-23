import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

type AlertVariant = 'danger' | 'warning' | 'success' | 'info';

interface InlineAlertProps {
  children: ReactNode;
  title?: string;
  variant?: AlertVariant;
}

const styles: Record<AlertVariant, string> = {
  danger: 'border-danger/30 bg-danger-soft text-danger',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  success: 'border-success/30 bg-success-soft text-success',
  info: 'border-info/30 bg-info-soft text-info',
};

const icons = {
  danger: CircleAlert,
  warning: TriangleAlert,
  success: CircleCheck,
  info: Info,
} satisfies Record<AlertVariant, typeof Info>;

export function InlineAlert({
  children,
  title,
  variant = 'info',
}: InlineAlertProps) {
  const Icon = icons[variant];
  return (
    <div
      className={`flex gap-3 rounded-md border p-3 text-body-sm ${styles[variant]}`}
      role={variant === 'danger' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
    </div>
  );
}
