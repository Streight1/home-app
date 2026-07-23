import { DatePicker } from '../../../../components/ui/DatePicker/DatePicker.js';

export function TaskDueDatePicker({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <DatePicker
      label="Datum termínu"
      calendarLabel="Kalendář termínu"
      value={value}
      {...(error ? { error } : {})}
      onChange={onChange}
    />
  );
}
