import { Button } from '../../../../components/ui/Button/Button.js';
import { formatMinorUnits } from '../../lib/money.js';
import type { FinancialTransaction } from '../../types/finance.types.js';
import {
  financialTransactionLabel,
  financialTransactionTypeLabel,
} from './financialTransactionPresentation.js';

export function FinancialTransactionDesktopTable({
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
    <div className="hidden overflow-x-auto rounded-lg border border-border lg:block">
      <table className="w-full border-collapse text-left text-body-sm">
        <thead className="bg-surface-subtle text-text-muted">
          <tr>
            {onSelectedChange ? <th className="px-4 py-3">Vybrat</th> : null}
            <th className="px-4 py-3">Datum</th>
            <th className="px-4 py-3">Transakce</th>
            <th className="px-4 py-3">Kategorie</th>
            <th className="px-4 py-3">Účet</th>
            <th className="px-4 py-3 text-right">Částka</th>
            <th className="px-4 py-3">Dokumenty</th>
            <th className="px-4 py-3 text-right">Akce</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface-raised">
          {items.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-surface-hover">
              {onSelectedChange ? (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Vybrat transakci ${financialTransactionLabel(transaction)}`}
                    checked={selectedIds?.has(transaction.id) ?? false}
                    disabled={
                      transaction.type !== 'EXPENSE' &&
                      transaction.type !== 'REFUND'
                    }
                    onChange={(event) =>
                      onSelectedChange(transaction.id, event.target.checked)
                    }
                  />
                </td>
              ) : null}
              <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                {new Intl.DateTimeFormat('cs-CZ').format(
                  new Date(`${transaction.bookedDate}T00:00:00`),
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  className="font-medium focus-visible:outline-2 focus-visible:outline-focus"
                  onClick={() => onOpen(transaction.id)}
                >
                  {financialTransactionLabel(transaction)}
                </button>
                <p className="text-caption text-text-muted">
                  {financialTransactionTypeLabel(transaction)}
                </p>
              </td>
              <td className="px-4 py-3">
                {transaction.category?.name ?? 'Bez kategorie'}
              </td>
              <td className="px-4 py-3">{transaction.account.name}</td>
              <td
                className={`px-4 py-3 text-right font-semibold tabular-nums ${transaction.type === 'INCOME' || transaction.type === 'TRANSFER_IN' ? 'text-success' : 'text-text'}`}
              >
                {transaction.type === 'EXPENSE' ||
                transaction.type === 'TRANSFER_OUT'
                  ? '−'
                  : '+'}
                {formatMinorUnits(
                  transaction.amount.amountMinor,
                  transaction.amount.currencyCode,
                )}
              </td>
              <td className="px-4 py-3">
                {transaction.documents.length > 0
                  ? `${String(transaction.documents.length)} připojeno`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  aria-label={`Otevřít transakci ${financialTransactionLabel(transaction)}`}
                  onClick={() => onOpen(transaction.id)}
                >
                  Otevřít
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
