import { useRef } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useFinanceMutations } from '../../hooks/useFinance.js';
import { formatMinorUnits } from '../../lib/money.js';
import type { FinancialTransaction } from '../../types/finance.types.js';

export function DeleteFinancialTransferDialog({
  open,
  transaction,
  onOpenChange,
  onDeleted,
}: {
  open: boolean;
  transaction: FinancialTransaction;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) {
  const remove = useFinanceMutations().deleteTransfer;
  const deleting = useRef(false);
  const deleteTransfer = () => {
    if (!transaction.transfer || deleting.current) return;
    deleting.current = true;
    remove.mutate(transaction.transfer.id, {
      onSuccess: onDeleted,
      onSettled: () => {
        deleting.current = false;
      },
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !remove.isPending && onOpenChange(next)}
      title="Smazat převod?"
      description="Odchozí i příchozí ledgerový zápis budou společně vyřazené ze zůstatků a reportů."
      size="sm"
    >
      <div className="rounded-md bg-surface-subtle p-4 text-body-sm">
        <p className="font-medium">
          {transaction.transfer?.fromAccountName} →{' '}
          {transaction.transfer?.toAccountName}
        </p>
        <p className="mt-2 tabular-nums text-text-muted">
          {transaction.bookedDate} ·{' '}
          {formatMinorUnits(
            transaction.amount.amountMinor,
            transaction.amount.currencyCode,
          )}
        </p>
      </div>
      {remove.isError ? (
        <div className="mt-4">
          <InlineAlert variant="danger">
            Převod se nepodařilo smazat.
          </InlineAlert>
        </div>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button disabled={remove.isPending} onClick={() => onOpenChange(false)}>
          Ponechat
        </Button>
        <Button
          variant="danger"
          loading={remove.isPending}
          onClick={deleteTransfer}
        >
          Smazat celý převod
        </Button>
      </div>
    </Dialog>
  );
}
