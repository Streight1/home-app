import { Input } from '../../../../components/ui/Input/Input.js';

export function BudgetCategoryLimitField({
  name,
  limit,
  threshold,
  onLimitChange,
  onThresholdChange,
}: {
  name: string;
  limit: string;
  threshold: number;
  onLimitChange: (value: string) => void;
  onThresholdChange: (value: number) => void;
}) {
  return (
    <fieldset className="grid gap-3 rounded-md border border-border p-3">
      <legend className="px-1 text-body-sm font-semibold">{name}</legend>
      <Input
        label={`Limit · ${name}`}
        inputMode="decimal"
        value={limit}
        onChange={(event) => onLimitChange(event.target.value)}
      />
      <Input
        label={`Varovat při · ${name} (%)`}
        type="number"
        min={1}
        max={100}
        value={threshold}
        onChange={(event) => onThresholdChange(Number(event.target.value))}
      />
    </fieldset>
  );
}
