import { FinanceImportWizard } from '../components/FinanceImportWizard.js';
import { FinanceImportHistory } from '../components/history/FinanceImportHistory.js';

export function FinanceImportWorkspaceView({
  canWrite,
}: {
  canWrite: boolean;
}) {
  return (
    <div className="grid gap-6">
      {canWrite ? <FinanceImportWizard /> : null}
      <section className="rounded-lg border border-border bg-surface-raised p-4 sm:p-6">
        <h2 className="text-section-title font-semibold">Historie importů</h2>
        <div className="mt-4">
          <FinanceImportHistory />
        </div>
      </section>
    </div>
  );
}
