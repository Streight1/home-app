import { useState, type SyntheticEvent } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import {
  useFinancialAccounts,
  useFinanceMutations,
} from '../../hooks/useFinance.js';
import {
  minorUnitsToInput,
  parseMoneyInputToMinorUnits,
} from '../../lib/money.js';
import type { FinancialTransaction } from '../../types/finance.types.js';
import { localToday, TransactionDateField } from './TransactionDateField.js';

export function FinancialTransferDialog({
  open,
  onOpenChange,
  transfer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer?: FinancialTransaction;
}) {
  const accounts = useFinancialAccounts();
  const mutations = useFinanceMutations();
  const mutation = transfer
    ? mutations.updateTransfer
    : mutations.createTransfer;
  const [fromAccountId, setFromAccountId] = useState(
    transfer?.transfer?.fromAccountId ?? '',
  );
  const [toAccountId, setToAccountId] = useState(
    transfer?.transfer?.toAccountId ?? '',
  );
  const [amount, setAmount] = useState(
    transfer ? minorUnitsToInput(transfer.amount.amountMinor) : '',
  );
  const [bookedDate, setBookedDate] = useState(
    transfer?.bookedDate ?? localToday,
  );
  const [note, setNote] = useState(transfer?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const fromAccount = accounts.data?.items.find(
    (account) => account.id === fromAccountId,
  );
  const toAccount = accounts.data?.items.find(
    (account) => account.id === toAccountId,
  );
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId)
        throw new Error('Vyberte dva různé účty.');
      if (fromAccount?.currencyCode !== toAccount?.currencyCode)
        throw new Error('Převod je možný jen mezi účty ve stejné měně.');
      const amountMinor = parseMoneyInputToMinorUnits(amount);
      if (BigInt(amountMinor) <= 0n)
        throw new Error('Částka musí být vyšší než nula.');
      const data = {
        fromAccountId,
        toAccountId,
        amountMinor,
        bookedDate,
        note: note.trim() || null,
      };
      if (transfer?.transfer)
        mutations.updateTransfer.mutate(
          { id: transfer.transfer.id, data },
          { onSuccess: () => onOpenChange(false) },
        );
      else
        mutations.createTransfer.mutate(data, {
          onSuccess: () => onOpenChange(false),
        });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Převod nemá platné údaje.',
      );
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={transfer ? 'Upravit převod' : 'Převod mezi účty'}
      description="Oba ledgerové zápisy vzniknou atomicky a převod se nepočítá jako výdaj ani příjem."
      size="md"
      mobileFullScreen
    >
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Z účtu"
            value={fromAccountId}
            onChange={(event) => setFromAccountId(event.target.value)}
            required
          >
            <option value="">Vyberte účet</option>
            {accounts.data?.items.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currencyCode}
              </option>
            ))}
          </Select>
          <Select
            label="Na účet"
            value={toAccountId}
            onChange={(event) => setToAccountId(event.target.value)}
            required
          >
            <option value="">Vyberte účet</option>
            {accounts.data?.items.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currencyCode}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Částka"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
        <TransactionDateField
          label="Datum převodu"
          value={bookedDate}
          onChange={setBookedDate}
        />
        <Textarea
          label="Poznámka"
          value={note}
          maxLength={10_000}
          onChange={(event) => setNote(event.target.value)}
        />
        {error ? (
          <p className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button type="submit" variant="primary" loading={mutation.isPending}>
            {transfer ? 'Uložit převod' : 'Provést převod'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
