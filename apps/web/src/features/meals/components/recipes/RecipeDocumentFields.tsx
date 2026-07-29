import { useDocumentPickerOptions } from '../../../documents/documents.public.js';
import type { RecipeInput } from '../../types/meals.types.js';

export function RecipeDocumentFields({
  value,
  onChange,
}: {
  value: RecipeInput['documents'];
  onChange: (value: RecipeInput['documents']) => void;
}) {
  const documents = useDocumentPickerOptions();
  return (
    <fieldset>
      <legend className="mb-2 text-section-title font-semibold">
        Dokumenty a fotografie
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {(documents.data ?? []).map((document) => {
          const selected = value.some(
            ({ documentId }) => documentId === document.id,
          );
          return (
            <label
              key={document.id}
              className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2"
            >
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={selected}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [
                          ...value,
                          {
                            documentId: document.id,
                            relationType: 'PHOTO',
                            isCover: value.length === 0,
                          },
                        ]
                      : value.filter(
                          ({ documentId }) => documentId !== document.id,
                        ),
                  )
                }
              />
              <span className="truncate text-body-sm">
                {document.primaryLabel}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
