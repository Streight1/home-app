import { FileCheck2, UploadCloud, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import {
  formatDocumentType,
  formatFileSize,
} from '../../lib/documentFormat.js';
import { documentFileAccept } from '../../schemas/documentForm.schema.js';

export function DocumentFilePicker({
  file,
  error,
  disabled,
  onSelect,
  onRemove,
}: {
  file: File | null;
  error: string | null;
  disabled: boolean;
  onSelect: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const change = (event: ChangeEvent<HTMLInputElement>) =>
    onSelect(event.target.files?.[0]);
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDrag(false);
    onSelect(event.dataTransfer.files[0]);
  };
  return (
    <div>
      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success-soft p-4">
          <FileCheck2
            className="size-6 shrink-0 text-success"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-semibold text-text">
              {file.name}
            </p>
            <p className="mt-1 text-caption text-text-muted">
              {formatDocumentType(file.type)} · {formatFileSize(file.size)}
            </p>
          </div>
          <IconButton
            aria-label="Odebrat vybraný soubor"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              if (ref.current) ref.current.value = '';
              onRemove();
            }}
          >
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
      ) : (
        <div
          className={`rounded-lg border border-dashed p-6 text-center transition-colors md:p-8 ${drag ? 'border-primary bg-primary-soft' : error ? 'border-danger bg-danger-soft' : 'border-border-strong bg-surface-subtle'}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDrag(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDrag(false)}
          onDrop={drop}
        >
          <UploadCloud
            className="mx-auto size-8 text-primary-emphasis"
            aria-hidden="true"
          />
          <p className="mt-3 text-body-sm font-semibold text-text">
            Přetáhněte soubor sem
          </p>
          <p className="mt-1 text-caption text-text-muted">
            nebo jej vyberte ze zařízení
          </p>
          <label
            htmlFor="document-file"
            className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface-raised px-4 text-body-sm font-medium text-text hover:bg-surface-hover focus-within:outline-2 focus-within:outline-focus"
          >
            Vybrat soubor
            <input
              ref={ref}
              id="document-file"
              type="file"
              accept={documentFileAccept}
              className="sr-only"
              onChange={change}
              disabled={disabled}
            />
          </label>
        </div>
      )}
      {error ? (
        <p className="mt-2 text-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
