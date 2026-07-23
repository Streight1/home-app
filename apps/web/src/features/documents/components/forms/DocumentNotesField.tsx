import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';

export function DocumentNotesField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Textarea
      label="Poznámky"
      value={value}
      disabled={disabled}
      maxLength={50_000}
      hint={`${value.length.toLocaleString('cs-CZ')} / 50 000 znaků. Prostý text bez HTML.`}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
