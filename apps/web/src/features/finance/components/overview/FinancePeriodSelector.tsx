import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';
import { Select } from '../../../../components/ui/Select/Select.js';

export type FinancePeriodKind = 'current' | 'previous' | 'custom';

export interface FinancePeriodSelection {
  kind: FinancePeriodKind;
  dateFrom?: string;
  dateTo?: string;
}

export function FinancePeriodSelector({
  value,
  onChange,
}: {
  value: FinancePeriodSelection;
  onChange: (value: FinancePeriodSelection) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[14rem_1fr_1fr] sm:items-end">
      <Select
        label="Období přehledu"
        value={value.kind}
        onChange={(event) =>
          onChange({ kind: event.target.value as FinancePeriodKind })
        }
      >
        <option value="current">Tento měsíc</option>
        <option value="previous">Minulý měsíc</option>
        <option value="custom">Vlastní období</option>
      </Select>
      {value.kind === 'custom' ? (
        <>
          <DatePicker
            label="Od"
            value={value.dateFrom ?? ''}
            onChange={(dateFrom) => onChange({ ...value, dateFrom })}
          />
          <DatePicker
            label="Do"
            value={value.dateTo ?? ''}
            onChange={(dateTo) => onChange({ ...value, dateTo })}
          />
        </>
      ) : null}
    </div>
  );
}
