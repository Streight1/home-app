import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { FinancialAccount } from '../../../finance/types/finance.types.js';
import type { ImportPreviewRow } from '../../types/finance-import.types.js';

export function CreditCardTransferReview({
  rows,
  accounts,
  loading,
  onReview,
}: {
  rows: ImportPreviewRow[];
  accounts: FinancialAccount[];
  loading: boolean;
  onReview: (
    row: ImportPreviewRow,
    input:
      | { transactionType: 'REFUND'; userIncluded: true }
      | {
          transactionType: 'TRANSFER_IN';
          transferSourceAccountId: string;
          userIncluded: true;
        },
  ) => void;
}) {
  const [sources, setSources] = useState<Record<string, string>>({});
  if (!rows.length) return null;
  return (
    <section className="grid gap-3" aria-labelledby="card-review-title">
      <div>
        <h3 id="card-review-title" className="font-semibold">
          Zkontrolovat příchozí pohyby kreditní karty
        </h3>
        <p className="text-body-sm text-text-muted">
          Rozhodněte, zda jde o vrácení nákupu, nebo splátku z jiného účtu.
          Splátka se nezapočítá jako příjem ani další výdaj.
        </p>
      </div>
      {!accounts.length ? (
        <InlineAlert variant="warning">
          Pro zaúčtování splátky potřebujete jiný aktivní účet ve stejné měně.
        </InlineAlert>
      ) : null}
      {rows.map((row) => {
        const source = sources[row.id] ?? row.transferSourceAccountId ?? '';
        return (
          <div
            key={row.id}
            className="grid gap-3 rounded-md border border-border bg-surface-subtle p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div>
              <p className="font-medium">
                {row.counterpartyName ??
                  row.description ??
                  `Řádek ${String(row.rowNumber)}`}
              </p>
              <p className="text-caption text-text-muted">
                Příchozí karetní pohyb vyžaduje rozhodnutí.
              </p>
            </div>
            <Select
              label="Zdrojový účet splátky"
              value={source}
              onChange={(event) =>
                setSources((current) => ({
                  ...current,
                  [row.id]: event.target.value,
                }))
              }
            >
              <option value="">Vyberte účet</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={loading}
                onClick={() =>
                  onReview(row, {
                    transactionType: 'REFUND',
                    userIncluded: true,
                  })
                }
              >
                Vrácení platby
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!source || loading}
                onClick={() =>
                  source &&
                  onReview(row, {
                    transactionType: 'TRANSFER_IN',
                    transferSourceAccountId: source,
                    userIncluded: true,
                  })
                }
              >
                Splacení karty
              </Button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
