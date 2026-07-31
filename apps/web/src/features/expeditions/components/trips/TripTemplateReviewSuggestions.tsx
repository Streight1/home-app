import { ListRestart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useExpeditionMutations,
  useTripTemplateReviewPreview,
} from '../../hooks/useExpeditions.js';
import { formatWeight } from '../../lib/expeditionLabels.js';

export function TripTemplateReviewSuggestions({
  tripId,
  enabled,
}: {
  tripId: string;
  enabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [addIds, setAddIds] = useState<string[]>([]);
  const preview = useTripTemplateReviewPreview(tripId, enabled);
  const mutation = useExpeditionMutations().applyTemplateReview;
  useEffect(() => {
    setRemoveIds(
      preview.data?.remove.map(({ tripItemId }) => tripItemId) ?? [],
    );
    setAddIds(preview.data?.add.map(({ tripItemId }) => tripItemId) ?? []);
  }, [preview.data]);
  if (
    !enabled ||
    !preview.data?.available ||
    (preview.data.remove.length === 0 && preview.data.add.length === 0)
  )
    return null;
  return (
    <>
      <div className="rounded-lg border border-border bg-surface-subtle p-4">
        <h4 className="font-semibold">Doporučení pro gearlist</h4>
        <p className="mt-1 text-body-sm text-text-muted">
          Z vyhodnocení vzniklo {preview.data.remove.length}{' '}
          {preview.data.remove.length === 1
            ? 'doporučení k odebrání'
            : 'doporučení k odebrání'}{' '}
          a {preview.data.add.length} k přidání. Šablona se nezmění bez
          potvrzení.
        </p>
        <Button className="mt-3" onClick={() => setOpen(true)}>
          <ListRestart className="size-4" aria-hidden="true" />
          Zkontrolovat návrhy
        </Button>
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`Upravit gearlist ${preview.data.templateName ?? ''}?`}
        description="Vyberte pouze změny, které chcete vědomě promítnout do opakovaně použitelné šablony."
        size="lg"
        mobileFullScreen
      >
        <div className="grid gap-5">
          {preview.data.remove.length ? (
            <fieldset className="grid gap-2">
              <legend className="font-semibold">Navržené odebrání</legend>
              {preview.data.remove.map((item) => (
                <label
                  key={item.tripItemId}
                  className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3"
                >
                  <input
                    type="checkbox"
                    checked={removeIds.includes(item.tripItemId)}
                    onChange={(event) =>
                      setRemoveIds((current) =>
                        event.target.checked
                          ? [...current, item.tripItemId]
                          : current.filter((id) => id !== item.tripItemId),
                      )
                    }
                  />
                  <span>{item.name}</span>
                  <span className="ml-auto text-caption text-text-muted">
                    {formatWeight(item.weightGrams)}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
          {preview.data.add.length ? (
            <fieldset className="grid gap-2">
              <legend className="font-semibold">Navržené přidání</legend>
              {preview.data.add.map((item) => (
                <label
                  key={item.tripItemId}
                  className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3"
                >
                  <input
                    type="checkbox"
                    checked={addIds.includes(item.tripItemId)}
                    onChange={(event) =>
                      setAddIds((current) =>
                        event.target.checked
                          ? [...current, item.tripItemId]
                          : current.filter((id) => id !== item.tripItemId),
                      )
                    }
                  />
                  <span>{item.name}</span>
                  <span className="ml-auto text-caption text-text-muted">
                    {formatWeight(item.weightGrams)}
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
          {mutation.error ? (
            <InlineAlert variant="danger">{mutation.error.message}</InlineAlert>
          ) : null}
          <InlineAlert>
            Tato potvrzená operace mění pouze gearlist. Historická výprava a
            její snapshot zůstávají beze změny.
          </InlineAlert>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button onClick={() => setOpen(false)}>Zpět</Button>
            <Button
              variant="primary"
              loading={mutation.isPending}
              disabled={
                mutation.isPending ||
                (removeIds.length === 0 && addIds.length === 0)
              }
              onClick={() =>
                mutation.mutate(
                  {
                    tripId,
                    removeTripItemIds: removeIds,
                    addTripItemIds: addIds,
                  },
                  { onSuccess: () => setOpen(false) },
                )
              }
            >
              Potvrdit změny gearlistu
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
