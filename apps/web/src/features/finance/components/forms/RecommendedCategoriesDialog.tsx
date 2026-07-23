import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';

export function RecommendedCategoriesDialog({
  open,
  loading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !loading && onOpenChange(next)}
      title="Vytvořit doporučené kategorie?"
      description="Doplníme pouze chybějící upravitelné kategorie. Existující kategorie ani transakce se nezmění."
      size="sm"
    >
      <div className="flex flex-wrap justify-end gap-3">
        <Button disabled={loading} onClick={() => onOpenChange(false)}>
          Zrušit
        </Button>
        <Button variant="primary" loading={loading} onClick={onConfirm}>
          Vytvořit kategorie
        </Button>
      </div>
    </Dialog>
  );
}
