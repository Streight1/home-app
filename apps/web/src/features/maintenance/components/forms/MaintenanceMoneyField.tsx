import { useEffect, useRef, useState } from 'react';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  minorUnitsToInput,
  parseMoneyInputToMinorUnits,
} from '../../../finance/finance.public.js';

export function MaintenanceMoneyField({
  label,
  amountMinor,
  currencyCode,
  onChange,
}: {
  label: string;
  amountMinor: string | null;
  currencyCode: string | null;
  onChange: (value: {
    amountMinor: string | null;
    currencyCode: string | null;
  }) => void;
}) {
  const [input, setInput] = useState(() =>
    amountMinor ? minorUnitsToInput(amountMinor) : '',
  );
  const lastEmitted = useRef<string | null>(amountMinor);
  useEffect(() => {
    if (amountMinor === lastEmitted.current) return;
    setInput(amountMinor ? minorUnitsToInput(amountMinor) : '');
    lastEmitted.current = amountMinor;
  }, [amountMinor]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label={label}
        hint="Zadejte částku v běžném formátu, například 1 250,00."
        inputMode="decimal"
        pattern="[0-9 ]+([,.][0-9]{1,2})?"
        value={input}
        onChange={(event) => {
          const nextInput = event.target.value;
          setInput(nextInput);
          if (!nextInput.trim()) {
            lastEmitted.current = null;
            onChange({ amountMinor: null, currencyCode: null });
            return;
          }
          try {
            const parsed = parseMoneyInputToMinorUnits(nextInput);
            lastEmitted.current = parsed;
            onChange({
              amountMinor: parsed,
              currencyCode: currencyCode ?? 'CZK',
            });
          } catch {
            // Native input validation keeps an incomplete value from submission.
          }
        }}
      />
      <Select
        label="Měna"
        value={currencyCode ?? 'CZK'}
        disabled={!input}
        onChange={(event) =>
          onChange({
            amountMinor,
            currencyCode: event.target.value,
          })
        }
      >
        <option value="CZK">CZK</option>
        <option value="EUR">EUR</option>
      </Select>
    </div>
  );
}
