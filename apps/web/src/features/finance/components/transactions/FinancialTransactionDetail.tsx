import { useState } from 'react';
import { ArrowLeft, FileText, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useFinancialTransaction } from '../../hooks/useFinance.js';
import { formatMinorUnits } from '../../lib/money.js';
import { DeleteFinancialTransactionDialog } from '../forms/DeleteFinancialTransactionDialog.js';
import { DeleteFinancialTransferDialog } from '../forms/DeleteFinancialTransferDialog.js';
import { FinancialTransactionDialog } from '../forms/FinancialTransactionDialog.js';
import { FinancialTransferDialog } from '../forms/FinancialTransferDialog.js';

export function FinancialTransactionDetail({
  id,
  canEdit,
  onBack,
}: {
  id: string;
  canEdit: boolean;
  onBack: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferDeleteOpen, setTransferDeleteOpen] = useState(false);
  const [transferEditOpen, setTransferEditOpen] = useState(false);
  const transaction = useFinancialTransaction(id);
  if (transaction.isError)
    return (
      <InlineAlert variant="danger">
        Transakci se nepodařilo načíst.
      </InlineAlert>
    );
  if (!transaction.data)
    return <p className="text-body-sm text-text-muted">Načítáme transakci…</p>;
  const item = transaction.data;
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button onClick={onBack}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Zpět na seznam
        </Button>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                item.transfer ? setTransferEditOpen(true) : setEditOpen(true)
              }
            >
              <Pencil className="size-4" aria-hidden="true" />
              {item.transfer ? 'Upravit převod' : 'Upravit'}
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                item.transfer
                  ? setTransferDeleteOpen(true)
                  : setDeleteOpen(true)
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {item.transfer ? 'Smazat převod' : 'Smazat transakci'}
            </Button>
          </div>
        ) : null}
      </div>
      <Card className="p-5 sm:p-6">
        <p className="text-caption font-semibold uppercase tracking-wider text-text-muted">
          {item.type === 'EXPENSE'
            ? 'Výdaj'
            : item.type === 'INCOME'
              ? 'Příjem'
              : 'Převod'}
        </p>
        <h1 className="mt-2 text-page-title font-semibold tabular-nums">
          {formatMinorUnits(item.amount.amountMinor, item.amount.currencyCode)}
        </h1>
        <p className="mt-2 text-text-muted">
          {item.counterpartyName ?? item.description ?? 'Bez popisu'}
        </p>
        <dl className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-caption text-text-muted">Datum</dt>
            <dd className="mt-1">{item.bookedDate}</dd>
          </div>
          <div>
            <dt className="text-caption text-text-muted">Účet</dt>
            <dd className="mt-1">{item.account.name}</dd>
          </div>
          {item.transfer ? (
            <div>
              <dt className="text-caption text-text-muted">Směr převodu</dt>
              <dd className="mt-1">
                {item.transfer.fromAccountName} → {item.transfer.toAccountName}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-caption text-text-muted">Kategorie</dt>
            <dd className="mt-1">{item.category?.name ?? 'Bez kategorie'}</dd>
          </div>
          <div>
            <dt className="text-caption text-text-muted">Variabilní symbol</dt>
            <dd className="mt-1">{item.variableSymbol ?? '—'}</dd>
          </div>
        </dl>
        {item.note ? (
          <p className="mt-5 whitespace-pre-wrap rounded-md bg-surface-subtle p-4 text-body-sm">
            {item.note}
          </p>
        ) : null}
        {item.documents.length ? (
          <section className="mt-5">
            <h2 className="font-semibold">Dokumenty</h2>
            <ul className="mt-2 grid gap-2">
              {item.documents.map((document) => (
                <li
                  key={document.id}
                  className="flex min-h-11 items-center gap-2"
                >
                  <FileText className="size-4" aria-hidden="true" />
                  {document.primaryLabel}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Card>
      <DeleteFinancialTransactionDialog
        open={deleteOpen}
        transaction={item}
        onOpenChange={setDeleteOpen}
        onDeleted={onBack}
      />
      {item.transfer ? (
        <>
          <DeleteFinancialTransferDialog
            open={transferDeleteOpen}
            transaction={item}
            onOpenChange={setTransferDeleteOpen}
            onDeleted={onBack}
          />
          {transferEditOpen ? (
            <FinancialTransferDialog
              key={`${item.transfer.id}-${item.updatedAt}`}
              open
              transfer={item}
              onOpenChange={setTransferEditOpen}
            />
          ) : null}
        </>
      ) : null}
      {item.type === 'EXPENSE' || item.type === 'INCOME' ? (
        <FinancialTransactionDialog
          key={`${item.id}-${item.updatedAt}`}
          open={editOpen}
          type={item.type.toLowerCase() as 'expense' | 'income'}
          transaction={item}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </div>
  );
}
