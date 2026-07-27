import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { useCalendarMutations } from '../../hooks/useCalendar.js';

export function CalendarBulkDeleteDialog({
  open,
  eventIds,
  onOpenChange,
  onDeleted,
}: {
  open: boolean;
  eventIds: string[];
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const { previewBulk, deleteBulk } = useCalendarMutations();
  const [confirmation, setConfirmation] = useState('');
  const eventKey = eventIds.join('|');
  const preview = previewBulk.mutate;
  useEffect(() => {
    if (open && eventKey) preview(eventKey.split('|'));
    if (!open) setConfirmation('');
  }, [eventKey, open, preview]);
  const impact = previewBulk.data;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !deleteBulk.isPending && onOpenChange(next)}
      title="Smazat vybrané události?"
      description="Operace proběhne jako jeden celek. Pokud některá událost není dostupná, nesmaže se nic."
      size="sm"
      mobileFullScreen
    >
      <div className="grid gap-4">
        <dl className="grid gap-2 rounded-md border border-border bg-surface-subtle p-4 text-body-sm">
          <div className="flex justify-between gap-4">
            <dt>Vybrané události</dt>
            <dd className="font-semibold">
              {impact?.eventCount ?? eventIds.length}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Z úkolů</dt>
            <dd>{impact?.taskEventCount ?? '…'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Ze šablon</dt>
            <dd>{impact?.templateEventCount ?? '…'}</dd>
          </div>
        </dl>
        <InlineAlert variant="warning">
          Původní úkoly i šablony zůstanou zachované. Odstraní se pouze vybrané
          kalendářní události a jejich cestovní plány.
        </InlineAlert>
        <Input
          label="Pro potvrzení napište SMAZAT"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="off"
        />
        {previewBulk.isError || deleteBulk.isError ? (
          <InlineAlert variant="danger">
            Hromadné smazání se nepodařilo. Nebyla odstraněna žádná událost.
          </InlineAlert>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            disabled={deleteBulk.isPending}
            onClick={() => onOpenChange(false)}
          >
            Zpět
          </Button>
          <Button
            variant="danger"
            loading={deleteBulk.isPending}
            disabled={confirmation !== 'SMAZAT' || !impact}
            onClick={() =>
              deleteBulk.mutate(eventIds, {
                onSuccess: () => {
                  onOpenChange(false);
                  onDeleted();
                },
              })
            }
          >
            Smazat vybrané
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
