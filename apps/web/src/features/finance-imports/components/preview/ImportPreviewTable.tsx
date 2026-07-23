import { Badge } from '../../../../components/ui/Badge/Badge.js';
import { formatMinorUnits } from '../../../finance/lib/money.js';
import type { ImportPreviewRow } from '../../types/finance-import.types.js';
import type { ImportCategoryOption } from './ImportBulkCategoryControl.js';

const statusLabel: Record<ImportPreviewRow['status'], string> = {
  VALID: 'Připraveno',
  INVALID: 'Chyba',
  POSSIBLE_DUPLICATE: 'Možná duplicita',
  NEEDS_TRANSFER_REVIEW: 'Kontrola převodu',
  IMPORTED: 'Importováno',
  SKIPPED: 'Přeskočeno',
};
export function ImportPreviewTable({
  rows,
  categories = [],
  onIncludedChange,
  onCategoryChange,
}: {
  rows: ImportPreviewRow[];
  categories?: ImportCategoryOption[];
  onIncludedChange: (row: ImportPreviewRow, included: boolean) => void;
  onCategoryChange?: (row: ImportPreviewRow, categoryId: string | null) => void;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-body-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="p-3">Zahrnout</th>
              <th className="p-3">Datum</th>
              <th className="p-3">Popis</th>
              <th className="p-3">Částka</th>
              <th className="p-3">Kategorie</th>
              <th className="p-3">Stav</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="p-3">
                  <input
                    aria-label={`Zahrnout řádek ${String(row.rowNumber)}`}
                    type="checkbox"
                    checked={row.userIncluded}
                    disabled={
                      row.status === 'INVALID' ||
                      row.status === 'NEEDS_TRANSFER_REVIEW'
                    }
                    onChange={(event) =>
                      onIncludedChange(row, event.target.checked)
                    }
                  />
                </td>
                <td className="p-3 tabular-nums">{row.bookedDate ?? '—'}</td>
                <td className="p-3">
                  <span className="font-medium">
                    {row.counterpartyName ?? 'Bez protistrany'}
                  </span>
                  <span className="block text-caption text-text-muted">
                    {row.description ?? ''}
                  </span>
                </td>
                <td className="p-3 tabular-nums">
                  {row.amountMinor && row.currencyCode
                    ? formatMinorUnits(row.amountMinor, row.currencyCode)
                    : '—'}
                </td>
                <td className="p-3">
                  <select
                    aria-label={`Kategorie řádku ${String(row.rowNumber)}`}
                    className="min-h-11 rounded-md border border-border bg-input px-2"
                    value={row.categoryId ?? ''}
                    disabled={!onCategoryChange || row.status === 'INVALID'}
                    onChange={(event) =>
                      onCategoryChange?.(row, event.target.value || null)
                    }
                  >
                    <option value="">Nezařazeno</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <Badge>{statusLabel[row.status]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-md border border-border bg-surface-subtle p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {row.counterpartyName ??
                    row.description ??
                    `Řádek ${String(row.rowNumber)}`}
                </p>
                <p className="mt-1 text-caption text-text-muted">
                  {row.bookedDate ?? 'Neplatné datum'}
                </p>
              </div>
              <input
                className="size-11"
                aria-label={`Zahrnout řádek ${String(row.rowNumber)}`}
                type="checkbox"
                checked={row.userIncluded}
                disabled={
                  row.status === 'INVALID' ||
                  row.status === 'NEEDS_TRANSFER_REVIEW'
                }
                onChange={(event) =>
                  onIncludedChange(row, event.target.checked)
                }
              />
            </div>
            <p className="mt-3 font-semibold tabular-nums">
              {row.amountMinor && row.currencyCode
                ? formatMinorUnits(row.amountMinor, row.currencyCode)
                : '—'}
            </p>
            <label className="mt-3 grid gap-1 text-caption text-text-muted">
              Kategorie
              <select
                className="min-h-11 rounded-md border border-border bg-input px-2 text-body-sm text-text"
                value={row.categoryId ?? ''}
                disabled={!onCategoryChange || row.status === 'INVALID'}
                onChange={(event) =>
                  onCategoryChange?.(row, event.target.value || null)
                }
              >
                <option value="">Nezařazeno</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2">
              <Badge>{statusLabel[row.status]}</Badge>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
