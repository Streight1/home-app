import { FilePlus2 } from 'lucide-react';
import { useDocumentNavigation } from '../../navigation/useDocumentNavigation.js';

export function DocumentLibraryHeader({
  canMutate,
  view,
  onViewChange,
}: {
  canMutate: boolean;
  view: 'active' | 'archived' | 'trash';
  onViewChange: (view: 'active' | 'archived' | 'trash') => void;
}) {
  const navigation = useDocumentNavigation();
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:mb-8">
      <div>
        <p className="text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
          Domácí archiv
        </p>
        <h1 className="mt-2 text-page-title font-semibold tracking-tight text-text">
          {view === 'trash'
            ? 'Koš'
            : view === 'archived'
              ? 'Archiv dokumentů'
              : 'Dokumenty'}
        </h1>
        <p className="mt-2 max-w-2xl text-body-sm text-text-muted">
          Bezpečně uložené soubory, složky a ověřená metadata aktivní
          domácnosti.
        </p>
      </div>
      {canMutate ? (
        <button
          type="button"
          className="aurora-primary-action inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary px-4 text-body-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-focus"
          onClick={navigation.openDocumentCreate}
        >
          <FilePlus2 className="size-4" aria-hidden="true" /> Přidat dokument
        </button>
      ) : null}
      <nav
        className="flex flex-wrap gap-2 sm:basis-full"
        aria-label="Pohled dokumentů"
      >
        {(
          [
            ['active', 'Dokumenty'],
            ['archived', 'Archiv'],
            ['trash', 'Koš'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-current={view === key ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded-md px-3 text-body-sm font-medium focus-visible:outline-2 focus-visible:outline-focus ${view === key ? 'bg-selected text-primary-emphasis' : 'text-text-muted hover:bg-surface-hover hover:text-text'}`}
            onClick={() => onViewChange(key)}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
