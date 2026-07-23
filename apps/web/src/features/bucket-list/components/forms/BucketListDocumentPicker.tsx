import { FileText } from 'lucide-react';
import { useDocumentPickerOptions } from '../../../documents/documents.public.js';

export function BucketListDocumentPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const documents = useDocumentPickerOptions();
  return (
    <fieldset>
      <legend className="mb-2 text-body-sm font-semibold">Dokumenty</legend>
      {documents.isLoading ? (
        <p className="text-caption text-text-muted">Načítáme dokumenty…</p>
      ) : null}
      {documents.data?.length === 0 ? (
        <p className="text-caption text-text-muted">
          V knihovně zatím nejsou dokumenty k připojení.
        </p>
      ) : null}
      <div className="grid max-h-44 gap-2 overflow-y-auto">
        {documents.data?.map((document) => (
          <label
            key={document.id}
            className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              checked={selected.includes(document.id)}
              className="size-5 accent-primary"
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, document.id]
                    : selected.filter((id) => id !== document.id),
                )
              }
            />
            <FileText className="size-4 text-text-muted" aria-hidden="true" />
            <span className="min-w-0 truncate text-body-sm">
              {document.primaryLabel}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
