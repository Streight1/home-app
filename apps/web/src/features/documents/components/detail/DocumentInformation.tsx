import { Card } from '../../../../components/ui/Card/Card.js';
import { formatDocumentDate } from '../../lib/documentFormat.js';
import type {
  DocumentItem,
  MetadataValue,
  DocumentTypeDefinition,
} from '../../types/document.types.js';

function formatMetadataValue(value: MetadataValue): string {
  if (Array.isArray(value))
    return value.map((item) => item.description).join(', ');
  if (typeof value === 'boolean') return value ? 'Ano' : 'Ne';
  return String(value);
}

export function DocumentInformation({
  document,
  definition,
}: {
  document: DocumentItem;
  definition: DocumentTypeDefinition | undefined;
}) {
  const metadata = Object.entries(document.metadata);
  return (
    <Card className="p-5 md:p-6">
      <h2 className="text-section-title font-semibold text-text">
        Informace o dokumentu
      </h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
            Typ
          </dt>
          <dd className="mt-2 text-body-sm text-text-secondary">
            {definition?.label ?? document.type}
          </dd>
        </div>
        <div>
          <dt className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
            Složka
          </dt>
          <dd className="mt-2 text-body-sm text-text-secondary">
            {document.folder?.name ?? 'Kořen knihovny'}
          </dd>
        </div>
        <div>
          <dt className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
            Datum dokumentu
          </dt>
          <dd className="tabular-nums mt-2 text-body-sm text-text-secondary">
            {document.documentDate
              ? formatDocumentDate(document.documentDate)
              : 'Nevyplněno'}
          </dd>
        </div>
        <div>
          <dt className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
            Přidáno
          </dt>
          <dd className="tabular-nums mt-2 text-body-sm text-text-secondary">
            {formatDocumentDate(document.createdAt)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
            Popis
          </dt>
          <dd className="mt-2 whitespace-pre-wrap text-body-sm text-text-secondary">
            {document.description ?? 'Popis nebyl vyplněn.'}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-caption font-semibold uppercase tracking-wide text-text-subtle">
            Poznámky
          </dt>
          <dd className="mt-2 whitespace-pre-wrap break-words text-body-sm text-text-secondary">
            {document.notes ?? 'Poznámky nebyly vyplněny.'}
          </dd>
        </div>
      </dl>
      {metadata.length > 0 ? (
        <div className="mt-6 border-t border-border pt-5">
          <h3 className="font-semibold text-text">Strukturovaná metadata</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {metadata.map(([key, value]) => (
              <div key={key}>
                <dt className="text-caption text-text-subtle">
                  {definition?.fields.find((field) => field.key === key)
                    ?.label ?? key}
                </dt>
                <dd className="tabular-nums mt-1 break-words text-body-sm text-text">
                  {formatMetadataValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      <p className="mt-5 text-caption text-text-muted">
        Přidal: {document.createdBy.displayName ?? 'Člen domácnosti'}
      </p>
    </Card>
  );
}
