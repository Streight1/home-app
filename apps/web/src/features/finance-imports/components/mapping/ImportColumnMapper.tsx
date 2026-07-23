import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { ImportMapping } from '../../types/finance-import.types.js';

const fields = [
  ['bookedDate', 'Datum zaúčtování'],
  ['transactionDate', 'Datum transakce'],
  ['signedAmount', 'Částka se znaménkem'],
  ['debitAmount', 'Výdajový sloupec'],
  ['creditAmount', 'Příjmový sloupec'],
  ['currencyCode', 'Měna'],
  ['transactionType', 'Typ pohybu'],
  ['counterpartyName', 'Protistrana'],
  ['counterpartyAccount', 'Účet protistrany'],
  ['description', 'Popis'],
  ['variableSymbol', 'Variabilní symbol'],
  ['externalTransactionId', 'Externí ID'],
] as const;

export function ImportColumnMapper({
  headers,
  value,
  onChange,
}: {
  headers: string[];
  value: ImportMapping;
  onChange: (value: ImportMapping) => void;
}) {
  const setColumn = (field: string, column: string) => {
    const mapping = column
      ? { ...value.columnMapping, [field]: column }
      : Object.fromEntries(
          Object.entries(value.columnMapping).filter(([key]) => key !== field),
        );
    onChange({ ...value, columnMapping: mapping });
  };
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Způsob částky"
          value={value.amountColumnMode}
          onChange={(event) =>
            onChange({
              ...value,
              amountColumnMode: event.target
                .value as ImportMapping['amountColumnMode'],
            })
          }
        >
          <option value="SIGNED_AMOUNT">Jeden sloupec se znaménkem</option>
          <option value="SEPARATE_DEBIT_CREDIT">
            Samostatný výdaj a příjem
          </option>
          <option value="TRANSACTION_TYPE_AND_AMOUNT">
            Typ pohybu a částka
          </option>
        </Select>
        <Select
          label="Výchozí měna"
          value={value.defaultCurrencyCode ?? ''}
          onChange={(event) =>
            onChange({
              ...value,
              defaultCurrencyCode: event.target.value
                ? (event.target.value as 'CZK' | 'EUR')
                : null,
            })
          }
        >
          <option value="">Z účtu nebo sloupce</option>
          <option value="CZK">CZK</option>
          <option value="EUR">EUR</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([field, label]) => (
          <Select
            key={field}
            label={label}
            value={value.columnMapping[field] ?? ''}
            onChange={(event) => setColumn(field, event.target.value)}
          >
            <option value="">Nenamapováno</option>
            {headers.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </Select>
        ))}
      </div>
      <label className="flex min-h-11 items-center gap-3 text-body-sm">
        <input
          type="checkbox"
          checked={value.invertAmountSign}
          onChange={(event) =>
            onChange({ ...value, invertAmountSign: event.target.checked })
          }
        />{' '}
        Obrátit znaménko částek
      </label>
      <Input
        label="Uložit jako profil (volitelné)"
        value={value.saveProfileName ?? ''}
        onChange={(event) =>
          onChange({
            ...value,
            saveProfileName: event.target.value || undefined,
          })
        }
      />
    </div>
  );
}
