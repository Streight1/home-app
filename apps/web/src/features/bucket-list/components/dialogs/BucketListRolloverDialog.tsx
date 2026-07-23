import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Switch } from '../../../../components/ui/Switch/Switch.js';
import { useBucketListMutations } from '../../hooks/useBucketList.js';
import type { BucketList } from '../../types/bucket-list.types.js';

export function BucketListRolloverDialog({
  list,
  open,
  onOpenChange,
}: {
  list: BucketList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutations = useBucketListMutations();
  const targetYear = list.year + 1;
  const [selected, setSelected] = useState<string[]>([]);
  const [carryDocuments, setCarryDocuments] = useState(true);
  const [carryTargetDate, setCarryTargetDate] = useState(false);
  useEffect(() => {
    if (!open) return;
    mutations.prepareRollover.mutate(
      { listId: list.id, targetYear },
      {
        onSuccess: (data) =>
          setSelected(data.candidates.map((candidate) => candidate.id)),
      },
    );
  }, [open, list.id, targetYear]);
  const data = mutations.prepareRollover.data;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !mutations.carry.isPending && onOpenChange(next)}
      title={`Přenést do roku ${String(targetYear)}`}
      description="Vyberte nesplněná nebo přeskočená přání, která mají pokračovat."
      size="lg"
      mobileFullScreen
    >
      {mutations.prepareRollover.isError ? (
        <InlineAlert variant="danger">
          Návrh přenosu se nepodařilo načíst.
        </InlineAlert>
      ) : null}
      <div className="grid max-h-[50vh] gap-2 overflow-y-auto">
        {data?.candidates.map((candidate) => (
          <label
            key={candidate.id}
            className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              checked={selected.includes(candidate.id)}
              className="size-5 accent-primary"
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, candidate.id]
                    : current.filter((id) => id !== candidate.id),
                )
              }
            />
            <span className="min-w-0 flex-1">
              <strong className="block truncate">{candidate.title}</strong>
              <span className="text-caption text-text-muted">
                {candidate.status === 'SKIPPED' ? 'Přeskočeno' : 'Nesplněno'}
                {' · '}
                {candidate.participantCount} účastníků
              </span>
            </span>
          </label>
        ))}
      </div>
      {data?.candidates.length === 0 ? (
        <p className="rounded-md bg-surface-subtle p-4 text-body-sm text-text-muted">
          Není co přenést. Dokončené položky zůstávají jen v historii.
        </p>
      ) : null}
      <div className="mt-5 grid gap-3 border-t border-border pt-5">
        <div className="flex min-h-control items-center justify-between gap-4">
          <span className="text-body-sm text-text">
            Přenést odkazy na dokumenty
          </span>
          <Switch
            label="Přenést odkazy na dokumenty"
            checked={carryDocuments}
            onCheckedChange={setCarryDocuments}
          />
        </div>
        <div className="flex min-h-control items-center justify-between gap-4">
          <span className="text-body-sm text-text">
            Přenést cílová data do nového roku
          </span>
          <Switch
            label="Přenést cílová data do nového roku"
            checked={carryTargetDate}
            onCheckedChange={setCarryTargetDate}
          />
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={() => onOpenChange(false)}>Zpět</Button>
        <Button
          variant="primary"
          disabled={selected.length === 0}
          loading={mutations.carry.isPending}
          onClick={() =>
            mutations.carry.mutate(
              {
                listId: list.id,
                input: {
                  targetYear,
                  itemIds: selected,
                  carryDocuments,
                  carryTargetDate,
                },
              },
              { onSuccess: () => onOpenChange(false) },
            )
          }
        >
          Přenést {selected.length} položek
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </Dialog>
  );
}
