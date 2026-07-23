import { useState, type SyntheticEvent } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import {
  minorUnitsToInput,
  parseMoneyInputToMinorUnits,
} from '../../lib/money.js';
import type {
  FinancialAccount,
  FinancialCategory,
  FinancialTransactionInput,
  FinancialTransaction,
  SafeFinanceDocument,
} from '../../types/finance.types.js';
import { localToday, TransactionDateField } from './TransactionDateField.js';

export function FinancialTransactionForm({
  type,
  accounts,
  categories,
  documents,
  loading,
  onSubmit,
  onCancel,
  initial,
}: {
  type: 'expense' | 'income';
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  documents: SafeFinanceDocument[];
  loading: boolean;
  onSubmit: (input: FinancialTransactionInput, createRule: boolean) => void;
  onCancel: () => void;
  initial?: FinancialTransaction;
}) {
  const [accountId, setAccountId] = useState(
    initial?.account.id ?? accounts[0]?.id ?? '',
  );
  const [categoryId, setCategoryId] = useState(initial?.category?.id ?? '');
  const [amount, setAmount] = useState(
    initial ? minorUnitsToInput(initial.amount.amountMinor) : '',
  );
  const [bookedDate, setBookedDate] = useState(
    initial?.bookedDate ?? localToday,
  );
  const [counterpartyName, setCounterpartyName] = useState(
    initial?.counterpartyName ?? '',
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [variableSymbol, setVariableSymbol] = useState(
    initial?.variableSymbol ?? '',
  );
  const [note, setNote] = useState(initial?.note ?? '');
  const [documentIds, setDocumentIds] = useState<string[]>(
    initial?.documents.map((document) => document.id) ?? [],
  );
  const [createRule, setCreateRule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const validCategories = categories.filter(
    (category) =>
      category.kind === 'BOTH' || category.kind === type.toUpperCase(),
  );
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!accountId) throw new Error('Nejprve vyberte účet.');
      if (!bookedDate) throw new Error('Vyberte datum zaúčtování.');
      const amountMinor = parseMoneyInputToMinorUnits(amount);
      if (BigInt(amountMinor) <= 0n)
        throw new Error('Částka musí být vyšší než nula.');
      setError(null);
      onSubmit(
        {
          accountId,
          categoryId: categoryId || null,
          amountMinor,
          bookedDate,
          counterpartyName: counterpartyName.trim() || null,
          description: description.trim() || null,
          variableSymbol: variableSymbol.trim() || null,
          note: note.trim() || null,
          documentIds,
        },
        createRule,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Zkontrolujte zadané údaje.',
      );
    }
  };
  return (
    <form className="grid gap-5" onSubmit={submit}>
      {accounts.length === 0 ? (
        <p className="rounded-md bg-warning-soft p-3 text-body-sm text-warning">
          Nejdříve vytvořte finanční účet.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Účet"
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          required
        >
          <option value="">Vyberte účet</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} · {account.currencyCode}
            </option>
          ))}
        </Select>
        <Input
          label="Částka"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </div>
      {selectedAccount ? (
        <p className="-mt-3 text-caption text-text-muted" aria-live="polite">
          Měna transakce: {selectedAccount.currencyCode}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TransactionDateField
          label="Datum zaúčtování"
          value={bookedDate}
          onChange={setBookedDate}
        />
        <Select
          label="Kategorie"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">Bez kategorie</option>
          {validCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <Input
        label={
          type === 'expense' ? 'Komu jste platili' : 'Od koho platba přišla'
        }
        value={counterpartyName}
        maxLength={200}
        onChange={(event) => setCounterpartyName(event.target.value)}
      />
      {!initial && categoryId && counterpartyName.trim() ? (
        <label className="flex min-h-11 items-start gap-3 rounded-md bg-surface-subtle p-3 text-body-sm">
          <input
            type="checkbox"
            checked={createRule}
            onChange={(event) => setCreateRule(event.target.checked)}
          />
          <span>
            <span className="font-medium">
              Příště podobné platby zařadit automaticky
            </span>
            <span className="mt-1 block text-caption text-text-muted">
              Po potvrzení vznikne pravidlo pro tuto protistranu, účet a typ
              transakce.
            </span>
          </span>
        </label>
      ) : null}
      <Input
        label="Popis"
        value={description}
        maxLength={1_000}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Input
        label="Variabilní symbol"
        inputMode="numeric"
        value={variableSymbol}
        maxLength={20}
        onChange={(event) => setVariableSymbol(event.target.value)}
      />
      <Textarea
        label="Poznámka"
        value={note}
        maxLength={10_000}
        onChange={(event) => setNote(event.target.value)}
      />
      {documents.length > 0 ? (
        <fieldset className="grid gap-2 rounded-md border border-border p-3">
          <legend className="px-1 text-body-sm font-medium">
            Připojené dokumenty
          </legend>
          {documents.map((document) => (
            <label
              key={document.id}
              className="flex min-h-11 items-center gap-3 text-body-sm"
            >
              <input
                type="checkbox"
                checked={documentIds.includes(document.id)}
                onChange={(event) =>
                  setDocumentIds((current) =>
                    event.target.checked
                      ? [...current, document.id]
                      : current.filter((id) => id !== document.id),
                  )
                }
              />
              {document.primaryLabel}
            </label>
          ))}
        </fieldset>
      ) : null}
      {error ? (
        <p className="text-body-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" onClick={onCancel}>
          Zrušit
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={accounts.length === 0}
        >
          {initial
            ? 'Uložit změny'
            : type === 'expense'
              ? 'Uložit výdaj'
              : 'Uložit příjem'}
        </Button>
      </div>
    </form>
  );
}
