import { ClipboardCopy, RotateCcw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useExpeditionMutations } from '../../hooks/useExpeditions.js';
import type { Trip } from '../../types/expeditions.types.js';

export function PackingBulkActions({
  trip,
  selectedIds,
  onClearSelection,
}: {
  trip: Trip;
  selectedIds: readonly string[];
  onClearSelection: () => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const mutations = useExpeditionMutations();
  const resetIds = trip.items
    .filter(({ packingStatus }) => packingStatus !== 'EXCLUDED')
    .map(({ id }) => id);
  const copyList = async () => {
    const text = trip.items
      .filter(({ packingStatus }) => packingStatus !== 'EXCLUDED')
      .map(
        (item) =>
          `${item.packingStatus === 'PACKED' ? '✓' : '□'} ${item.name} (${item.quantity} × ${String(item.unitWeightGrams)} g)`,
      )
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('Seznam byl zkopírován do schránky.');
    } catch {
      setCopyMessage('Seznam se nepodařilo zkopírovat.');
    }
  };
  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2"
        aria-label="Hromadné akce balení"
      >
        <Button
          onClick={() => void copyList()}
          disabled={trip.items.length === 0}
        >
          <ClipboardCopy className="size-4" aria-hidden="true" />
          Zkopírovat seznam
        </Button>
        <Button
          onClick={() => setResetOpen(true)}
          disabled={resetIds.length === 0}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Resetovat balení
        </Button>
        {selectedIds.length > 0 ? (
          <>
            <Button
              variant="danger"
              loading={mutations.packing.isPending}
              onClick={() =>
                mutations.packing.mutate(
                  {
                    tripId: trip.id,
                    itemIds: [...selectedIds],
                    status: 'MISSING',
                  },
                  { onSuccess: onClearSelection },
                )
              }
            >
              <TriangleAlert className="size-4" aria-hidden="true" />
              Označit vybrané jako chybějící ({selectedIds.length})
            </Button>
            <Button variant="ghost" onClick={onClearSelection}>
              Zrušit výběr
            </Button>
          </>
        ) : null}
      </div>
      <p className="text-caption text-text-muted" aria-live="polite">
        {copyMessage}
      </p>
      <Dialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Resetovat stav balení?"
        description="Všechny zahrnuté položky se vrátí do stavu Plánováno. Položky vyloučené ze seznamu zůstanou beze změny."
      >
        {mutations.packing.error ? (
          <InlineAlert variant="danger">
            Stav balení se nepodařilo resetovat.
          </InlineAlert>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setResetOpen(false)}>Zpět</Button>
          <Button
            variant="danger"
            loading={mutations.packing.isPending}
            onClick={() =>
              mutations.packing.mutate(
                {
                  tripId: trip.id,
                  itemIds: resetIds,
                  status: 'PLANNED',
                },
                { onSuccess: () => setResetOpen(false) },
              )
            }
          >
            Resetovat
          </Button>
        </div>
      </Dialog>
    </>
  );
}
