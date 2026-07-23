import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useFinanceImportHistory } from '../../hooks/useFinanceImports.js';

export function FinanceImportHistory() {
  const history = useFinanceImportHistory();
  if (history.isError)
    return (
      <InlineAlert variant="danger">
        Historii importů se nepodařilo načíst.
      </InlineAlert>
    );
  if (history.isPending)
    return (
      <p role="status" className="text-body-sm text-text-muted">
        Načítáme historii…
      </p>
    );
  if (!history.data.items.length)
    return (
      <EmptyState
        compact
        title="Zatím žádné importy"
        description="Po potvrzení prvního CSV importu zde uvidíte bezpečný souhrn bez obsahu bankovního výpisu."
      />
    );
  return (
    <div className="grid gap-2">
      {history.data.items.map((item) => (
        <article key={item.id} className="rounded-md border border-border p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-medium">{item.originalFilename}</p>
              <p className="text-caption text-text-muted">
                {item.account.name}
              </p>
            </div>
            <span className="text-caption text-text-muted">{item.status}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
