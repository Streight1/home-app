import { useState } from 'react';
import { Archive, Landmark, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Card } from '../../../../components/ui/Card/Card.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import {
  useFinanceMutations,
  useFinancialAccounts,
} from '../../hooks/useFinance.js';
import { formatMinorUnits } from '../../lib/money.js';
import type { FinancialAccount } from '../../types/finance.types.js';
import { FinancialAccountDialog } from '../forms/FinancialAccountDialog.js';

export function FinancialAccountsPanel({
  canManage,
  onAdd,
}: {
  canManage: boolean;
  onAdd: () => void;
}) {
  const [editing, setEditing] = useState<FinancialAccount | null>(null);
  const accounts = useFinancialAccounts(true);
  const archive = useFinanceMutations().setAccountArchived;
  if (accounts.isPending)
    return (
      <p className="text-body-sm text-text-muted" role="status">
        Načítáme účty…
      </p>
    );
  if (accounts.isError)
    return (
      <InlineAlert variant="danger">
        Účty se nepodařilo načíst.{' '}
        <button
          type="button"
          className="min-h-11 px-2 underline"
          onClick={() => void accounts.refetch()}
        >
          Zkusit znovu
        </button>
      </InlineAlert>
    );
  if (accounts.data.items.length === 0)
    return (
      <EmptyState
        eyebrow={<Landmark className="mx-auto size-5" aria-hidden="true" />}
        title="Zatím nemáte žádný účet"
        description="Přidejte bankovní, spořicí nebo hotovostní účet bez napojení na banku."
        action={
          canManage ? (
            <Button variant="primary" onClick={onAdd}>
              <Plus className="size-4" aria-hidden="true" />
              Přidat účet
            </Button>
          ) : undefined
        }
      />
    );
  return (
    <div className="grid gap-4">
      {canManage ? (
        <div>
          <Button variant="primary" onClick={onAdd}>
            <Plus className="size-4" aria-hidden="true" />
            Přidat účet
          </Button>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.data.items.map((account) => (
          <Card
            key={account.id}
            className={`p-4 ${account.archivedAt ? 'opacity-70' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{account.name}</h2>
                <p className="text-caption text-text-muted">
                  {account.type} · {account.currencyCode}
                </p>
              </div>
              {account.archivedAt ? (
                <span className="rounded-md bg-surface-subtle px-2 py-1 text-caption">
                  Archivovaný
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-lg font-semibold tabular-nums">
              {account.type === 'CREDIT_CARD' && account.currentDebtMinor
                ? `Dluh ${formatMinorUnits(account.currentDebtMinor, account.currencyCode)}`
                : formatMinorUnits(
                    account.currentBalanceMinor,
                    account.currencyCode,
                  )}
            </p>
            {account.type === 'CREDIT_CARD' ? (
              <p className="mt-1 text-caption text-text-muted">
                {account.maskedIdentifier ?? 'Kreditní karta'}
                {account.availableCreditMinor
                  ? ` · dostupný limit ${formatMinorUnits(account.availableCreditMinor, account.currencyCode)}`
                  : ''}
              </p>
            ) : null}
            {canManage ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => setEditing(account)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Upravit
                </Button>
                <Button
                  variant="ghost"
                  loading={
                    archive.isPending && archive.variables.id === account.id
                  }
                  onClick={() =>
                    archive.mutate({
                      id: account.id,
                      archived: !account.archivedAt,
                    })
                  }
                >
                  {account.archivedAt ? (
                    <RotateCcw className="size-4" aria-hidden="true" />
                  ) : (
                    <Archive className="size-4" aria-hidden="true" />
                  )}
                  {account.archivedAt ? 'Obnovit' : 'Archivovat'}
                </Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      {editing ? (
        <FinancialAccountDialog
          key={editing.id}
          open
          account={editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}
    </div>
  );
}
