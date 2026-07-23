import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { useCurrentUser } from '../../../auth/hooks/useCurrentUser.js';
import { useHouseholdMembers } from '../../../household/household.public.js';
import { useBucketListMutations } from '../../hooks/useBucketList.js';
import type { BucketListItem } from '../../types/bucket-list.types.js';
import { BucketListItemForm } from '../forms/BucketListItemForm.js';

export function BucketListItemDialog({
  listId,
  item,
  open,
  onOpenChange,
}: {
  listId: string;
  item?: BucketListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const auth = useCurrentUser();
  const members = useHouseholdMembers();
  const mutations = useBucketListMutations();
  const mutation = item ? mutations.updateItem : mutations.createItem;
  const [dirty, setDirty] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const close = () => {
    setDirty(false);
    onOpenChange(false);
  };
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && dirty && !mutation.isPending) setConfirmClose(true);
          else if (!next && !mutation.isPending) close();
        }}
        title={item ? 'Upravit přání' : 'Nové přání'}
        description="Přidejte společný cíl, zážitek nebo nápad pro tento rok."
        size="lg"
        mobileFullScreen
      >
        <BucketListItemForm
          {...(item ? { item } : {})}
          {...(auth.data?.user.id ? { currentUserId: auth.data.user.id } : {})}
          members={members.data ?? []}
          loading={mutation.isPending}
          error={
            mutation.isError
              ? 'Položku se nepodařilo uložit. Zkontrolujte údaje a zkuste to znovu.'
              : null
          }
          onDirtyChange={setDirty}
          onCancel={() => (dirty ? setConfirmClose(true) : close())}
          onSubmit={(input) => {
            if (item)
              mutations.updateItem.mutate(
                { itemId: item.id, input },
                { onSuccess: close },
              );
            else
              mutations.createItem.mutate(
                { listId, input },
                { onSuccess: close },
              );
          }}
        />
      </Dialog>
      <Dialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Zahodit neuložené změny?"
        description="Údaje z formuláře se po zavření ztratí."
        size="sm"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button onClick={() => setConfirmClose(false)}>Pokračovat</Button>
          <Button variant="danger" onClick={close}>
            Zahodit změny
          </Button>
        </div>
      </Dialog>
    </>
  );
}
