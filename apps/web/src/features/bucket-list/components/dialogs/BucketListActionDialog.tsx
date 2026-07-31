import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { currentLocalDateOnly } from '../../../../lib/date/dateOnly.js';
import { useBucketListMutations } from '../../hooks/useBucketList.js';
import type { BucketListItem } from '../../types/bucket-list.types.js';

type Action = 'complete' | 'skip' | 'delete';

const copy = {
  complete: {
    title: 'Splnit přání?',
    description: 'Záznam zůstane v historii ročního seznamu.',
    button: 'Označit jako splněné',
  },
  skip: {
    title: 'Přeskočit letos?',
    description: 'Položku lze později vrátit do plánu nebo přenést dál.',
    button: 'Přeskočit letos',
  },
  delete: {
    title: 'Smazat položku?',
    description: 'Položka i její historie zmizí ze společného seznamu.',
    button: 'Smazat položku',
  },
} as const;

export function BucketListActionDialog({
  item,
  action,
  onClose,
}: {
  item: BucketListItem;
  action: Action | null;
  onClose: () => void;
}) {
  const mutations = useBucketListMutations();
  const [date, setDate] = useState(currentLocalDateOnly);
  const [note, setNote] = useState('');
  if (!action) return null;
  const pending =
    action === 'delete'
      ? mutations.deleteItem.isPending
      : mutations.lifecycle.isPending;
  const submit = () => {
    if (action === 'delete') {
      mutations.deleteItem.mutate(item.id, { onSuccess: onClose });
      return;
    }
    mutations.lifecycle.mutate(
      {
        itemId: item.id,
        action,
        input:
          action === 'complete'
            ? { completedDate: date, note }
            : { reason: note },
      },
      { onSuccess: onClose },
    );
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      title={copy[action].title}
      description={copy[action].description}
      size="sm"
    >
      <p className="mb-4 font-semibold">{item.title}</p>
      {action === 'complete' ? (
        <DatePicker label="Datum splnění" value={date} onChange={setDate} />
      ) : null}
      {action !== 'delete' ? (
        <div className="mt-4">
          <Textarea
            label={action === 'complete' ? 'Poznámka ke splnění' : 'Důvod'}
            value={note}
            maxLength={action === 'complete' ? 5000 : 1000}
            rows={4}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onClose} disabled={pending}>
          Zpět
        </Button>
        <Button
          variant={action === 'delete' ? 'danger' : 'primary'}
          loading={pending}
          onClick={submit}
        >
          {copy[action].button}
        </Button>
      </div>
    </Dialog>
  );
}
