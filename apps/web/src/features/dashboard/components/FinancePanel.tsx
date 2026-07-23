import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import { DashboardSection } from './DashboardSection.js';

interface FinancePanelProps {
  summary: string | null;
  meta: string | null;
}

export function FinancePanel({ summary, meta }: FinancePanelProps) {
  return (
    <DashboardSection
      title="Finance tohoto období"
      className="md:col-span-6 xl:col-span-4"
    >
      {summary ? (
        <div>
          <p className="tabular-nums text-2xl font-semibold text-text">
            {summary}
          </p>
          {meta ? (
            <p className="mt-2 text-body-sm text-text-muted">{meta}</p>
          ) : null}
        </div>
      ) : (
        <EmptyState
          compact
          title="Žádné finanční údaje."
          description="Finance zatím nejsou aktivní."
        />
      )}
    </DashboardSection>
  );
}
