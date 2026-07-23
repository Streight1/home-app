import { useEffect, useState } from 'react';
import { Input } from '../../../../components/ui/Input/Input.js';
import {
  minorUnitsToInput,
  parseMoneyInputToMinorUnits,
} from '../../lib/money.js';

export function FinancialAmountFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | undefined;
  onChange: (minorUnits: string | undefined) => void;
}) {
  const [input, setInput] = useState(() =>
    value === undefined ? '' : minorUnitsToInput(value),
  );
  const [error, setError] = useState<string>();
  useEffect(() => {
    if (value === undefined) setInput('');
  }, [value]);
  const commit = () => {
    if (!input.trim()) {
      setError(undefined);
      onChange(undefined);
      return;
    }
    try {
      const minorUnits = parseMoneyInputToMinorUnits(input);
      if (BigInt(minorUnits) < 0n)
        throw new Error('Částka filtru nesmí být záporná.');
      setError(undefined);
      onChange(minorUnits);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Částka nemá platný formát.',
      );
    }
  };
  return (
    <Input
      label={label}
      inputMode="decimal"
      placeholder="0,00"
      value={input}
      {...(error ? { error } : {})}
      onChange={(event) => setInput(event.target.value)}
      onBlur={commit}
    />
  );
}
