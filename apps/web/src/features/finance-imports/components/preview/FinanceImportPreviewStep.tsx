import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { ImportBulkCategoryControl } from './ImportBulkCategoryControl.js';
import { ImportPreviewTable } from './ImportPreviewTable.js';
import { CreditCardTransferReview } from './CreditCardTransferReview.js';
import type { FinanceImportWizardState } from '../../hooks/useFinanceImportWizard.js';

export function FinanceImportPreviewStep({
  wizard,
}: {
  wizard: FinanceImportWizardState;
}) {
  if (wizard.step !== 'preview') return null;
  const data = wizard.preview.data;
  const eligibleRows = data?.items.filter((row) => row.status !== 'INVALID');
  const transferRows =
    data?.items.filter(
      (row) =>
        row.status === 'NEEDS_TRANSFER_REVIEW' && !row.transferSourceAccountId,
    ) ?? [];
  const sourceAccounts =
    wizard.accounts.data?.items.filter(
      (account) =>
        !account.archivedAt &&
        account.id !== wizard.accountId &&
        account.currencyCode === wizard.session?.account.currencyCode,
    ) ?? [];
  return (
    <div className="grid gap-5">
      {wizard.preview.isPending ? <p role="status">Načítáme náhled…</p> : null}
      {wizard.preview.isError ? (
        <InlineAlert variant="danger">Náhled se nepodařilo načíst.</InlineAlert>
      ) : null}
      {wizard.session?.repeatedFile ? (
        <InlineAlert variant="warning">
          <span className="block font-medium">
            Stejný soubor už byl na tento účet importován.
          </span>
          <label className="mt-2 flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={wizard.confirmRepeatedFile}
              onChange={(event) =>
                wizard.setConfirmRepeatedFile(event.target.checked)
              }
            />{' '}
            Přesto chci pokračovat a zkontroloval(a) jsem možné duplicity.
          </label>
        </InlineAlert>
      ) : null}
      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Count label="Připraveno" value={data.session.counts?.valid ?? 0} />
            <Count label="Chyby" value={data.session.counts?.invalid ?? 0} />
            <Count
              label="Duplicity"
              value={data.session.counts?.possibleDuplicates ?? 0}
            />
            <Count label="Celkem" value={data.session.counts?.total ?? 0} />
          </div>
          <ImportBulkCategoryControl
            categories={wizard.categoryOptions}
            rowIds={(eligibleRows ?? []).map((row) => row.id)}
            loading={wizard.mutations.bulkCategory.isPending}
            onApply={(categoryId) =>
              wizard.session &&
              wizard.mutations.bulkCategory.mutate({
                importId: wizard.session.id,
                rowIds: (eligibleRows ?? []).map((row) => row.id),
                categoryId,
              })
            }
          />
          <ImportPreviewTable
            rows={data.items}
            categories={wizard.categoryOptions}
            onIncludedChange={(row, included) =>
              wizard.session &&
              wizard.mutations.updateRow.mutate({
                importId: wizard.session.id,
                rowId: row.id,
                data: { userIncluded: included },
              })
            }
            onCategoryChange={(row, categoryId) =>
              wizard.session &&
              wizard.mutations.updateRow.mutate({
                importId: wizard.session.id,
                rowId: row.id,
                data: { categoryId },
              })
            }
          />
          <CreditCardTransferReview
            rows={transferRows}
            accounts={sourceAccounts}
            loading={wizard.mutations.updateRow.isPending}
            onReview={(row, input) =>
              wizard.session &&
              wizard.mutations.updateRow.mutate({
                importId: wizard.session.id,
                rowId: row.id,
                data: input,
              })
            }
          />
          <PreviewPagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onChange={wizard.setPreviewPage}
          />
        </>
      ) : null}
      <div className="flex flex-wrap justify-between gap-3">
        <Button onClick={() => wizard.setCancelOpen(true)}>
          Zrušit import
        </Button>
        <div className="flex gap-3">
          <Button onClick={() => wizard.setStep('mapping')}>Zpět</Button>
          <Button
            variant="primary"
            loading={wizard.mutations.commit.isPending}
            disabled={
              !data ||
              Boolean(
                wizard.session?.repeatedFile && !wizard.confirmRepeatedFile,
              )
            }
            onClick={() => void wizard.commit()}
          >
            Potvrdit import
          </Button>
        </div>
      </div>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-surface-subtle p-3">
      <p className="text-caption text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function PreviewPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav
      className="flex items-center justify-between gap-3"
      aria-label="Stránkování náhledu"
    >
      <Button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Předchozí
      </Button>
      <span className="text-body-sm tabular-nums">
        Strana {page} z {Math.max(totalPages, 1)}
      </span>
      <Button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Další
      </Button>
    </nav>
  );
}
