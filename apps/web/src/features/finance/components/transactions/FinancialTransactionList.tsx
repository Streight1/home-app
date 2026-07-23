import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useFinancialTransactions } from '../../hooks/useFinance.js';
import type { FinanceListState } from '../../types/finance.types.js';
import { FinancialTransactionDesktopTable } from './FinancialTransactionDesktopTable.js';
import { FinancialTransactionFilters } from './FinancialTransactionFilters.js';
import { FinancialTransactionMobileList } from './FinancialTransactionMobileList.js';
import { BulkCategorizeTransactions } from '../../../finance-categorization/finance-categorization.public.js';

export function FinancialTransactionList({
  state,
  onStateChange,
  onOpen,
  onAddExpense,
  canWrite = true,
}: {
  state: FinanceListState;
  onStateChange: (state: FinanceListState) => void;
  onOpen: (id: string) => void;
  onAddExpense: () => void;
  canWrite?: boolean;
}) {
  const query = useFinancialTransactions(state);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  useEffect(() => setSelectedIds(new Set()), [state]);
  const setSelected = (id: string, selected: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  const update = (patch: Partial<FinanceListState>) =>
    onStateChange({ ...state, ...patch, page: patch.page ?? 1 });
  return (
    <div className="grid gap-4">
      <FinancialTransactionFilters state={state} onUpdate={update} />
      {query.isError ? (
        <InlineAlert variant="danger">
          Transakce se nepodařilo načíst.{' '}
          <button
            type="button"
            className="min-h-11 px-2 underline"
            onClick={() => void query.refetch()}
          >
            Zkusit znovu
          </button>
        </InlineAlert>
      ) : null}
      {query.isPending ? (
        <p className="text-body-sm text-text-muted" role="status">
          Načítáme transakce…
        </p>
      ) : null}
      {query.data?.items.length === 0 ? (
        <EmptyState
          eyebrow={<Search className="mx-auto size-5" aria-hidden="true" />}
          title="Žádné transakce"
          description="Zadaným filtrům neodpovídá žádný zápis."
          action={
            canWrite ? (
              <Button variant="primary" onClick={onAddExpense}>
                Přidat výdaj
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {query.data?.items.length ? (
        <>
          {canWrite ? (
            <BulkCategorizeTransactions
              transactionIds={[...selectedIds]}
              onCompleted={() => setSelectedIds(new Set())}
            />
          ) : null}
          <FinancialTransactionDesktopTable
            items={query.data.items}
            onOpen={onOpen}
            {...(canWrite
              ? { selectedIds, onSelectedChange: setSelected }
              : {})}
          />
          <FinancialTransactionMobileList
            items={query.data.items}
            onOpen={onOpen}
            {...(canWrite
              ? { selectedIds, onSelectedChange: setSelected }
              : {})}
          />
          <div className="flex items-center justify-between gap-3">
            <Button
              disabled={state.page <= 1}
              onClick={() => update({ page: state.page - 1 })}
            >
              Předchozí
            </Button>
            <span className="text-body-sm text-text-muted">
              Strana {query.data.pagination.page} z{' '}
              {Math.max(1, query.data.pagination.totalPages)}
            </span>
            <Button
              disabled={state.page >= query.data.pagination.totalPages}
              onClick={() => update({ page: state.page + 1 })}
            >
              Další
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
