import { SlidersHorizontal } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  useFinancialAccounts,
  useFinancialCategories,
} from '../../hooks/useFinance.js';
import type {
  FinanceListState,
  FinancialTransactionType,
} from '../../types/finance.types.js';
import { FinancialAmountFilter } from './FinancialAmountFilter.js';

export function FinancialTransactionFilters({
  state,
  onUpdate,
}: {
  state: FinanceListState;
  onUpdate: (patch: Partial<FinanceListState>) => void;
}) {
  const accounts = useFinancialAccounts();
  const categories = useFinancialCategories();
  const clear = () =>
    onUpdate({
      query: '',
      accountId: undefined,
      categoryId: undefined,
      type: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      amountFromMinor: undefined,
      amountToMinor: undefined,
      documentLinked: undefined,
      sortBy: 'bookedDate',
      sortDirection: 'desc',
    });
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_12rem_10rem]">
        <Input
          label="Hledat v transakcích"
          value={state.query}
          onChange={(event) => onUpdate({ query: event.target.value })}
        />
        <Select
          label="Typ"
          value={state.type ?? ''}
          onChange={(event) =>
            onUpdate({
              type: event.target.value
                ? (event.target.value as FinancialTransactionType)
                : undefined,
            })
          }
        >
          <option value="">Všechny typy</option>
          <option value="EXPENSE">Výdaje</option>
          <option value="INCOME">Příjmy</option>
          <option value="TRANSFER_OUT">Převody z účtu</option>
          <option value="TRANSFER_IN">Převody na účet</option>
          <option value="ADJUSTMENT">Úpravy zůstatku</option>
        </Select>
        <Select
          label="Na stránce"
          value={state.pageSize}
          onChange={(event) =>
            onUpdate({
              pageSize: Number(event.target.value) as 10 | 20 | 50 | 100,
            })
          }
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>
      <details className="rounded-lg border border-border bg-surface-subtle p-3">
        <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-medium focus-visible:outline-2 focus-visible:outline-focus">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Další filtry a řazení
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Účet"
            value={state.accountId ?? ''}
            disabled={accounts.isPending}
            onChange={(event) =>
              onUpdate({ accountId: event.target.value || undefined })
            }
          >
            <option value="">Všechny účty</option>
            {accounts.data?.items.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
          <Select
            label="Kategorie"
            value={state.categoryId ?? ''}
            disabled={categories.isPending}
            onChange={(event) =>
              onUpdate({ categoryId: event.target.value || undefined })
            }
          >
            <option value="">Všechny kategorie</option>
            {categories.data?.items.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Dokument"
            value={
              state.documentLinked === undefined
                ? ''
                : String(state.documentLinked)
            }
            onChange={(event) =>
              onUpdate({
                documentLinked:
                  event.target.value === ''
                    ? undefined
                    : event.target.value === 'true',
              })
            }
          >
            <option value="">Bez omezení</option>
            <option value="true">S dokumentem</option>
            <option value="false">Bez dokumentu</option>
          </Select>
          <DatePicker
            label="Datum od"
            value={state.dateFrom ?? ''}
            onChange={(dateFrom) => onUpdate({ dateFrom })}
          />
          <DatePicker
            label="Datum do"
            value={state.dateTo ?? ''}
            onChange={(dateTo) => onUpdate({ dateTo })}
          />
          <FinancialAmountFilter
            label="Částka od"
            value={state.amountFromMinor}
            onChange={(amountFromMinor) => onUpdate({ amountFromMinor })}
          />
          <FinancialAmountFilter
            label="Částka do"
            value={state.amountToMinor}
            onChange={(amountToMinor) => onUpdate({ amountToMinor })}
          />
          <Select
            label="Řadit podle"
            value={state.sortBy}
            onChange={(event) =>
              onUpdate({
                sortBy: event.target.value as FinanceListState['sortBy'],
              })
            }
          >
            <option value="bookedDate">Data transakce</option>
            <option value="amountMinor">Částky</option>
            <option value="counterpartyName">Protistrany</option>
            <option value="createdAt">Data vytvoření</option>
          </Select>
          <Select
            label="Směr řazení"
            value={state.sortDirection}
            onChange={(event) =>
              onUpdate({
                sortDirection: event.target.value as 'asc' | 'desc',
              })
            }
          >
            <option value="desc">Sestupně</option>
            <option value="asc">Vzestupně</option>
          </Select>
        </div>
        <Button type="button" variant="ghost" className="mt-3" onClick={clear}>
          Vymazat filtry
        </Button>
      </details>
    </div>
  );
}
