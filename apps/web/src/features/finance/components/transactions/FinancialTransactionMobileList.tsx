import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatMinorUnits } from '../../lib/money.js';
import type { FinancialTransaction } from '../../types/finance.types.js';
import {
  financialTransactionLabel,
  financialTransactionTypeLabel,
} from './financialTransactionPresentation.js';

export function FinancialTransactionMobileList({
  items,
  onOpen,
  selectedIds,
  onSelectedChange,
}: {
  items: FinancialTransaction[];
  onOpen: (id: string) => void;
  selectedIds?: ReadonlySet<string>;
  onSelectedChange?: (id: string, selected: boolean) => void;
}) {
  return (
    <ul className="grid gap-3 lg:hidden">
      {items.map((transaction) => (
        <li
          key={transaction.id}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised p-2"
        >
          {onSelectedChange ? (
            <input
              className="size-11 shrink-0"
              type="checkbox"
              aria-label={`Vybrat transakci ${financialTransactionLabel(transaction)}`}
              checked={selectedIds?.has(transaction.id) ?? false}
              disabled={
                transaction.type !== 'EXPENSE' && transaction.type !== 'REFUND'
              }
              onChange={(event) =>
                onSelectedChange(transaction.id, event.target.checked)
              }
            />
          ) : null}
          <button
            className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-md p-2 text-left focus-visible:outline-2 focus-visible:outline-focus"
            onClick={() => onOpen(transaction.id)}
          >
            {transaction.type === 'INCOME' ||
            transaction.type === 'TRANSFER_IN' ? (
              <ArrowDownLeft
                className="size-5 text-success"
                aria-hidden="true"
              />
            ) : (
              <ArrowUpRight
                className="size-5 text-text-muted"
                aria-hidden="true"
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="block break-words font-medium">
                {financialTransactionLabel(transaction)}
              </span>
              <span className="text-caption text-text-muted">
                {financialTransactionTypeLabel(transaction)} ·{' '}
                {transaction.bookedDate} · {transaction.account.name}
              </span>
              <span className="block text-caption text-text-muted">
                {transaction.category?.name ?? 'Bez kategorie'}
                {transaction.documents.length > 0
                  ? ` · ${String(transaction.documents.length)} dokumentů`
                  : ''}
              </span>
            </span>
            <span className="font-semibold tabular-nums">
              {formatMinorUnits(
                transaction.amount.amountMinor,
                transaction.amount.currencyCode,
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
