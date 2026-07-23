import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type { ImportFormat } from '../../types/finance-import.types.js';

export function CsvFormatSettings({
  value,
  onChange,
}: {
  value: ImportFormat;
  onChange: (value: ImportFormat) => void;
}) {
  const update = <Key extends keyof ImportFormat>(
    key: Key,
    next: ImportFormat[Key],
  ) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select
        label="Kódování"
        value={value.encoding}
        onChange={(event) =>
          update('encoding', event.target.value as ImportFormat['encoding'])
        }
      >
        <option value="utf-8">UTF-8</option>
        <option value="windows-1250">Windows-1250</option>
      </Select>
      <Select
        label="Oddělovač"
        value={value.delimiter}
        onChange={(event) =>
          update('delimiter', event.target.value as ImportFormat['delimiter'])
        }
      >
        <option value=";">Středník</option>
        <option value=",">Čárka</option>
        <option value={'\t'}>Tabulátor</option>
      </Select>
      <Select
        label="Formát data"
        value={value.dateFormat}
        onChange={(event) =>
          update('dateFormat', event.target.value as ImportFormat['dateFormat'])
        }
      >
        <option value="DD.MM.YYYY">DD.MM.YYYY</option>
        <option value="D.M.YYYY">D.M.YYYY</option>
        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
      </Select>
      <Select
        label="Desetinný oddělovač"
        value={value.decimalSeparator}
        onChange={(event) =>
          update('decimalSeparator', event.target.value as ',' | '.')
        }
      >
        <option value=",">Čárka</option>
        <option value=".">Tečka</option>
      </Select>
      <Input
        label="Řádek hlavičky"
        type="number"
        min={1}
        max={100}
        value={value.headerRowNumber}
        onChange={(event) =>
          update('headerRowNumber', Number(event.target.value))
        }
      />
      <label className="flex min-h-11 items-center gap-3 text-body-sm font-medium">
        <input
          type="checkbox"
          checked={value.hasHeader}
          onChange={(event) => update('hasHeader', event.target.checked)}
        />{' '}
        První zvolený řádek je hlavička
      </label>
    </div>
  );
}
