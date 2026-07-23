import { Button } from '../../../../components/ui/Button/Button.js';
import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';

export const localToday = () => {
  const date = new Date();
  return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function TransactionDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <DatePicker label={label} value={value} onChange={onChange} />
      <Button
        type="button"
        variant="ghost"
        className="justify-self-start"
        onClick={() => onChange(localToday())}
      >
        Dnes
      </Button>
    </div>
  );
}
