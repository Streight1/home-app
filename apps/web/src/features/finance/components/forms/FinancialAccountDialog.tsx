import { useState, type SyntheticEvent } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { useFinanceMutations } from '../../hooks/useFinance.js';
import { parseMoneyInputToMinorUnits } from '../../lib/money.js';
import { minorUnitsToInput } from '../../lib/money.js';
import type { FinancialAccount } from '../../types/finance.types.js';
import { localToday } from './TransactionDateField.js';

export function FinancialAccountDialog({
  open,
  account,
  onOpenChange,
}: {
  open: boolean;
  account?: FinancialAccount;
  onOpenChange: (open: boolean) => void;
}) {
  const mutations = useFinanceMutations();
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState(account?.type ?? 'CURRENT');
  const [currencyCode, setCurrencyCode] = useState(
    account?.currencyCode ?? 'CZK',
  );
  const [balance, setBalance] = useState(
    account
      ? minorUnitsToInput(
          account.type === 'CREDIT_CARD' &&
            BigInt(account.openingBalanceMinor) < 0n
            ? (-BigInt(account.openingBalanceMinor)).toString()
            : account.openingBalanceMinor,
        )
      : '0,00',
  );
  const [creditLimit, setCreditLimit] = useState(
    account?.creditLimitMinor
      ? minorUnitsToInput(account.creditLimitMinor)
      : '',
  );
  const [statementDay, setStatementDay] = useState(
    account?.statementDayOfMonth?.toString() ?? '',
  );
  const [dueDay, setDueDay] = useState(
    account?.paymentDueDayOfMonth?.toString() ?? '',
  );
  const [maskedIdentifier, setMaskedIdentifier] = useState(
    account?.maskedIdentifier ?? '',
  );
  const [balanceDate, setBalanceDate] = useState(
    account?.openingBalanceDate ?? localToday,
  );
  const [error, setError] = useState<string | null>(null);
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (!name.trim()) throw new Error('Zadejte název účtu.');
      const parsedBalance = parseMoneyInputToMinorUnits(balance);
      const data = {
        name: name.trim(),
        type,
        currencyCode,
        openingBalanceMinor:
          type === 'CREDIT_CARD' && BigInt(parsedBalance) > 0n
            ? (-BigInt(parsedBalance)).toString()
            : parsedBalance,
        openingBalanceDate: balanceDate,
        description: null,
        colorToken: 'violet',
        iconKey: type === 'CASH' ? 'wallet' : 'landmark',
        creditLimitMinor:
          type === 'CREDIT_CARD' && creditLimit
            ? parseMoneyInputToMinorUnits(creditLimit)
            : null,
        statementDayOfMonth:
          type === 'CREDIT_CARD' && statementDay ? Number(statementDay) : null,
        paymentDueDayOfMonth:
          type === 'CREDIT_CARD' && dueDay ? Number(dueDay) : null,
        maskedIdentifier:
          type === 'CREDIT_CARD' && maskedIdentifier.trim()
            ? maskedIdentifier.trim()
            : null,
      };
      if (account)
        mutations.updateAccount.mutate(
          { id: account.id, data },
          { onSuccess: () => onOpenChange(false) },
        );
      else
        mutations.createAccount.mutate(data, {
          onSuccess: () => onOpenChange(false),
        });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Zkontrolujte údaje účtu.',
      );
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={account ? 'Upravit účet' : 'Nový účet'}
      description="Počáteční zůstatek slouží jako začátek účetního ledgeru."
      size="md"
      mobileFullScreen
    >
      <form className="grid gap-4" onSubmit={submit}>
        <Input
          label="Název účtu"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Typ účtu"
            value={type}
            onChange={(event) =>
              setType(event.target.value as FinancialAccount['type'])
            }
          >
            <option value="CURRENT">Běžný účet</option>
            <option value="SAVINGS">Spořicí účet</option>
            <option value="CREDIT_CARD">Kreditní karta</option>
            <option value="CASH">Hotovost</option>
            <option value="OTHER">Jiný</option>
          </Select>
          <Select
            label="Měna"
            value={currencyCode}
            onChange={(event) =>
              setCurrencyCode(
                event.target.value as FinancialAccount['currencyCode'],
              )
            }
          >
            <option value="CZK">CZK</option>
            <option value="EUR">EUR</option>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={
              type === 'CREDIT_CARD' ? 'Výchozí dluh' : 'Počáteční zůstatek'
            }
            inputMode="decimal"
            value={balance}
            onChange={(event) => setBalance(event.target.value)}
            required
          />
          <DatePicker
            label="Datum počátečního zůstatku"
            value={balanceDate}
            onChange={setBalanceDate}
          />
        </div>
        {type === 'CREDIT_CARD' ? (
          <div className="grid gap-4 rounded-md bg-surface-subtle p-4 sm:grid-cols-2">
            <Input
              label="Kreditní limit"
              inputMode="decimal"
              value={creditLimit}
              onChange={(event) => setCreditLimit(event.target.value)}
            />
            <Input
              label="Označení karty"
              placeholder="•••• 1234"
              value={maskedIdentifier}
              onChange={(event) => setMaskedIdentifier(event.target.value)}
            />
            <Input
              label="Den výpisu"
              type="number"
              min={1}
              max={31}
              value={statementDay}
              onChange={(event) => setStatementDay(event.target.value)}
            />
            <Input
              label="Den splatnosti"
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
            />
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-body-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button onClick={() => onOpenChange(false)}>Zrušit</Button>
          <Button
            type="submit"
            variant="primary"
            loading={
              mutations.createAccount.isPending ||
              mutations.updateAccount.isPending
            }
          >
            {account ? 'Uložit změny' : 'Vytvořit účet'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
