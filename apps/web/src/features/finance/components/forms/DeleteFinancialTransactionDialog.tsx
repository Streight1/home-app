import { useRef } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useFinanceMutations } from '../../hooks/useFinance.js';
import { formatMinorUnits } from '../../lib/money.js';
import type { FinancialTransaction } from '../../types/finance.types.js';

export function DeleteFinancialTransactionDialog({
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
  const remove = useFinanceMutations().deleteTransaction;
  const deleting = useRef(false);
  const deleteTransaction = () => {
    if (deleting.current) return;
    deleting.current = true;
    remove.mutate(transaction.id, {
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
      title="Smazat transakci?"
      description="Ruční zápis přestane ovlivňovat zůstatek i finanční reporty. Tuto akci nelze v této verzi obnovit."
      size="sm"
    >
      <dl className="grid gap-3 rounded-md bg-surface-subtle p-4 text-body-sm">
        <div>
          <dt className="text-text-muted">Transakce</dt>
          <dd className="font-medium">
            {transaction.counterpartyName ??
              transaction.description ??
              'Bez popisu'}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Datum a účet</dt>
          <dd>
            {transaction.bookedDate} · {transaction.account.name}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Částka</dt>
          <dd className="font-semibold tabular-nums">
            {formatMinorUnits(
              transaction.amount.amountMinor,
              transaction.amount.currencyCode,
            )}
          </dd>
        </div>
      </dl>
      {remove.isError ? (
        <div className="mt-4">
          <InlineAlert variant="danger">
            Transakci se nepodařilo smazat.
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
          onClick={deleteTransaction}
        >
          Smazat transakci
        </Button>
      </div>
    </Dialog>
  );
}
