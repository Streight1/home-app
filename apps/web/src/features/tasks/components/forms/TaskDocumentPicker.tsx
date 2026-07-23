import { FileText } from 'lucide-react';
import { useDocumentPickerOptions } from '../../../documents/documents.public.js';

export function TaskDocumentPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const documents = useDocumentPickerOptions();
  return (
    <fieldset>
      <legend className="mb-3 text-section-title font-semibold">
        5. Dokumenty
      </legend>
      {documents.isLoading ? (
        <p className="text-body-sm text-text-muted">Načítáme dokumenty…</p>
      ) : null}
      {documents.data?.length === 0 ? (
        <p className="text-body-sm text-text-muted">
          V knihovně zatím nejsou dokumenty k připojení.
        </p>
      ) : null}
      <div className="grid max-h-48 gap-2 overflow-y-auto">
        {documents.data?.map((document) => (
          <label
            key={document.id}
            className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 text-body-sm hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              checked={value.includes(document.id)}
              className="size-5 accent-primary focus-visible:outline-2 focus-visible:outline-focus"
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, document.id]
                    : value.filter((id) => id !== document.id),
                )
              }
            />
            <FileText
              className="size-4 shrink-0 text-text-muted"
              aria-hidden="true"
            />
            <span className="min-w-0 truncate">{document.primaryLabel}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
