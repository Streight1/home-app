import { Badge } from '../../../components/ui/Badge/Badge.js';

interface DashboardHeaderProps {
  displayName: string;
  householdName: string;
}

export function DashboardHeader({
  displayName,
  householdName,
}: DashboardHeaderProps) {
  return (
    <header className="aurora-header-surface mb-6 overflow-hidden rounded-xl border border-border p-5 shadow-sm md:mb-8 md:p-7">
      <Badge variant="primary">{householdName}</Badge>
      <h1 className="mt-4 text-page-title font-semibold tracking-[-0.03em] text-text md:text-display">
        Dobrý den, {displayName}
      </h1>
      <p className="mt-2 max-w-(--layout-reading-max) text-body text-text-secondary">
        Tady budete mít přehled o tom, co doma právě potřebuje pozornost.
      </p>
    </header>
  );
}
