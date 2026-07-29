import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useMealsMutations } from '../../hooks/useMeals.js';

export function ShoppingGenerationPreview({
  listId,
  from,
  to,
  onClose,
}: {
  listId: string;
  from: string;
  to: string;
  onClose: () => void;
}) {
  const mutations = useMealsMutations();
  const [excluded, setExcluded] = useState<string[]>([]);
  const [pantryConfirmed, setPantryConfirmed] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(from);
  const [dateTo, setDateTo] = useState(to);
  const [subtractPantry, setSubtractPantry] = useState(true);
  const [includeOptional, setIncludeOptional] = useState(false);
  const items = mutations.preview.data?.items ?? [];
  const loadPreview = mutations.preview.mutate;

  useEffect(() => {
    if (dateTo < dateFrom) return;
    loadPreview({
      listId,
      input: { dateFrom, dateTo, subtractPantry, includeOptional },
    });
  }, [dateFrom, dateTo, includeOptional, listId, loadPreview, subtractPantry]);

  return (
    <section
      className="rounded-lg border border-primary bg-selected-surface p-4"
      aria-live="polite"
    >
      <h3 className="font-semibold">Náhled položek z jídelníčku</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <DatePicker label="Od data" value={dateFrom} onChange={setDateFrom} />
        <DatePicker label="Do data" value={dateTo} onChange={setDateTo} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={subtractPantry}
            onChange={(event) => setSubtractPantry(event.target.checked)}
          />
          Odečíst potvrzené zásoby
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={includeOptional}
            onChange={(event) => setIncludeOptional(event.target.checked)}
          />
          Zahrnout volitelné suroviny
        </label>
      </div>
      {dateTo < dateFrom ? (
        <InlineAlert variant="danger">
          Konec období nesmí být před začátkem.
        </InlineAlert>
      ) : null}
      {mutations.preview.isPending ? (
        <p className="mt-2 text-body-sm text-text-muted">
          Připravujeme agregaci a odečet zásob…
        </p>
      ) : null}
      {mutations.preview.isError ? (
        <InlineAlert variant="danger">
          {mutations.preview.error.message}
        </InlineAlert>
      ) : null}
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item.key} className="grid gap-2">
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-surface-raised px-3">
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={!excluded.includes(item.key)}
                onChange={(event) =>
                  setExcluded((current) =>
                    event.target.checked
                      ? current.filter((key) => key !== item.key)
                      : [...current, item.key],
                  )
                }
              />
              <span className="flex-1">{item.text}</span>
              <span>
                {item.quantity ?? 'podle chuti'} {item.unit}
              </span>
            </label>
            {item.pantryNeedsConfirmation ? (
              <label className="ml-8 flex min-h-11 items-center gap-2 text-body-sm text-text-muted">
                <input
                  type="checkbox"
                  checked={pantryConfirmed.includes(item.key)}
                  onChange={(event) =>
                    setPantryConfirmed((current) =>
                      event.target.checked
                        ? [...current, item.key]
                        : current.filter((key) => key !== item.key),
                    )
                  }
                />
                Potvrzuji, že je surovina doma; nepřidávat na seznam
              </label>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={onClose}>Zrušit</Button>
        <Button
          variant="primary"
          loading={mutations.confirmGeneration.isPending}
          disabled={!items.length || dateTo < dateFrom}
          onClick={() =>
            mutations.confirmGeneration.mutate(
              {
                listId,
                input: {
                  dateFrom,
                  dateTo,
                  subtractPantry,
                  includeOptional,
                  confirmed: true,
                  excludedKeys: excluded,
                  pantryConfirmedKeys: pantryConfirmed,
                },
              },
              { onSuccess: onClose },
            )
          }
        >
          <Check className="size-4" aria-hidden="true" />
          Přidat vybrané
        </Button>
      </div>
    </section>
  );
}
