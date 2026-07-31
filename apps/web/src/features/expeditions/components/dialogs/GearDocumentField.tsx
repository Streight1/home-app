import type { Dispatch, SetStateAction } from 'react';
import { useDocumentPickerOptions } from '../../../documents/documents.public.js';
import type { GearInput } from '../../types/expeditions.types.js';

export function GearDocumentField({
  value,
  setValue,
}: {
  value: GearInput;
  setValue: Dispatch<SetStateAction<GearInput>>;
}) {
  const documents = useDocumentPickerOptions();
  return (
    <fieldset className="grid gap-3 rounded-lg border border-border p-4">
      <legend className="px-2 text-body-sm font-semibold">
        Dokument z knihovny
      </legend>
      <label className="grid gap-2 text-body-sm font-medium">
        Fotografie nebo návod z Dokumentů
        <select
          className="min-h-11 rounded-md border border-border bg-input px-3"
          value={value.documents[0]?.documentId ?? ''}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              documents: event.target.value
                ? [
                    {
                      documentId: event.target.value,
                      relationType: 'PHOTO',
                      isCover: true,
                    },
                  ]
                : [],
            }))
          }
        >
          <option value="">Bez dokumentu</option>
          {(documents.data ?? []).map((document) => (
            <option key={document.id} value={document.id}>
              {document.primaryLabel}
            </option>
          ))}
        </select>
      </label>
      <p className="text-caption text-text-muted">
        Pro další fotografie a návody lze vazby spravovat v detailu výbavy.
      </p>
    </fieldset>
  );
}
