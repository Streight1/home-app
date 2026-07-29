import { CircleDollarSign } from 'lucide-react';
import {
  formatMinorUnits,
  useFinancialTransactions,
} from '../../../finance/finance.public.js';

export function MaintenanceTransactionPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const transactions = useFinancialTransactions({
    page: 1,
    pageSize: 100,
    query: '',
    sortBy: 'bookedDate',
    sortDirection: 'desc',
  });
  return (
    <fieldset>
      <legend className="mb-2 text-body-sm font-semibold">
        Finanční transakce
      </legend>
      {transactions.isLoading ? (
        <p className="text-caption text-text-muted">Načítáme transakce…</p>
      ) : null}
      {transactions.data?.items.length === 0 ? (
        <p className="text-caption text-text-muted">
          Zatím není dostupná žádná transakce.
        </p>
      ) : null}
      <div className="grid max-h-44 gap-2 overflow-y-auto">
        {transactions.data?.items.map((transaction) => (
          <label
            key={transaction.id}
            className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-surface-hover"
          >
            <input
              type="checkbox"
              checked={selected.includes(transaction.id)}
              className="size-5 accent-primary"
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, transaction.id]
                    : selected.filter((id) => id !== transaction.id),
                )
              }
            />
            <CircleDollarSign
              className="size-4 text-text-muted"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-body-sm">
              <span className="block truncate">
                {transaction.counterpartyName ??
                  transaction.description ??
                  'Transakce bez popisu'}
              </span>
              <span className="text-caption text-text-muted">
                {transaction.bookedDate}
              </span>
            </span>
            <strong className="shrink-0 text-body-sm">
              {formatMinorUnits(
                transaction.amount.amountMinor,
                transaction.amount.currencyCode,
              )}
            </strong>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
