import { FileText } from 'lucide-react';
import { WorkspaceLink } from '../../../app/workspace-navigation/WorkspaceLink.js';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState.js';
import type { DocumentStatus } from '../types/document.types.js';

export function DocumentEmptyState({ status }: { status: DocumentStatus }) {
  const archived = status === 'ARCHIVED';
  const trashed = status === 'TRASHED';
  return (
    <EmptyState
      eyebrow={
        <span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary-soft text-primary-emphasis">
          <FileText className="size-6" aria-hidden="true" />
        </span>
      }
      title={
        trashed
          ? 'Koš je prázdný'
          : archived
            ? 'Archiv je prázdný'
            : 'Zatím tu nejsou žádné dokumenty'
      }
      description={
        trashed
          ? 'Dokumenty přesunuté do koše zde můžete obnovit nebo trvale odstranit.'
          : archived
            ? 'Archivované dokumenty zůstanou bezpečně uložené a můžete je kdykoli obnovit.'
            : 'Uložte první důležitý soubor domácnosti. Přístup k němu budou mít pouze oprávnění členové.'
      }
      action={
        archived || trashed ? undefined : (
          <WorkspaceLink
            view={{ area: 'documents', screen: 'new' }}
            className="aurora-primary-action inline-flex min-h-11 items-center justify-center rounded-md border border-primary px-4 text-body-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-focus"
          >
            Přidat první dokument
          </WorkspaceLink>
        )
      }
    />
  );
}
