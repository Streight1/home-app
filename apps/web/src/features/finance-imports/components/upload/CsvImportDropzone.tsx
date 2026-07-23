import { FileUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { webEnvironment } from '../../../../lib/config/environment.js';

export function CsvImportDropzone({
  file,
  onChange,
  error,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const select = async (selected: File | null) => {
    if (!selected) {
      setValidationError(null);
      onChange(null);
      return;
    }
    const invalid = await validateCsvFile(selected);
    setValidationError(invalid);
    onChange(invalid ? null : selected);
  };
  return (
    <div className="grid gap-3">
      <div
        className="rounded-lg border border-dashed border-border-strong bg-surface-subtle p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          void select(event.dataTransfer.files[0] ?? null);
        }}
      >
        <FileUp
          className="mx-auto size-8 text-primary-emphasis"
          aria-hidden="true"
        />
        <p className="mt-3 font-semibold">Nahrajte CSV výpis</p>
        <p className="mt-1 text-body-sm text-text-muted">
          UTF-8, Windows-1250, čárka, středník nebo tabulátor.
        </p>
        <input
          ref={input}
          className="sr-only"
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          onChange={(event) => void select(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          className="mt-4"
          onClick={() => input.current?.click()}
        >
          Vybrat soubor
        </Button>
      </div>
      {file ? (
        <p className="text-body-sm">
          <span className="font-medium">{file.name}</span> ·{' '}
          {Math.ceil(file.size / 1024).toLocaleString('cs-CZ')} kB
        </p>
      ) : null}
      {error || validationError ? (
        <p className="text-body-sm text-danger" role="alert">
          {error ?? validationError}
        </p>
      ) : null}
    </div>
  );
}

export async function validateCsvFile(file: File): Promise<string | null> {
  if (file.size === 0) return 'CSV soubor je prázdný.';
  if (file.size > webEnvironment.financeImportMaxFileBytes)
    return 'CSV soubor překročil povolenou velikost.';
  if (
    file.type &&
    ![
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
    ].includes(file.type)
  )
    return 'Vybraný soubor není textové CSV.';
  const sample = await readFileSample(file.slice(0, 4096));
  if (sample.includes(0)) return 'Binární soubor nelze importovat jako CSV.';
  return null;
}

function readFileSample(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('CSV soubor nelze přečíst.'));
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('CSV soubor nelze přečíst.'));
        return;
      }
      resolve(new Uint8Array(reader.result));
    };
    reader.readAsArrayBuffer(blob);
  });
}
