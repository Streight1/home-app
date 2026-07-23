import type { ReactNode } from 'react';
import { Card } from '../../../components/ui/Card/Card.js';

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className = '',
}: DashboardSectionProps) {
  return (
    <Card className={`min-w-0 p-5 md:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-section-title font-semibold tracking-tight text-text">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-body-sm text-text-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}
