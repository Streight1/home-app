import type { CalendarMemberColorToken } from '../api/householdApi.js';

const colors: {
  value: CalendarMemberColorToken;
  label: string;
  className: string;
}[] = [
  { value: 'violet', label: 'Fialová', className: 'bg-member-violet' },
  { value: 'blue', label: 'Modrá', className: 'bg-member-blue' },
  { value: 'cyan', label: 'Tyrkysová', className: 'bg-member-cyan' },
  { value: 'green', label: 'Zelená', className: 'bg-member-green' },
  { value: 'amber', label: 'Jantarová', className: 'bg-member-amber' },
  { value: 'orange', label: 'Oranžová', className: 'bg-member-orange' },
  { value: 'rose', label: 'Růžovočervená', className: 'bg-member-rose' },
  { value: 'pink', label: 'Růžová', className: 'bg-member-pink' },
];

export function MemberCalendarColorPicker({
  value,
  name,
  disabled,
  onChange,
}: {
  value: CalendarMemberColorToken;
  name: string;
  disabled: boolean;
  onChange: (value: CalendarMemberColorToken) => void;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">Barva člena v kalendáři</legend>
      <div className="flex flex-wrap gap-1" role="radiogroup">
        {colors.map((color) => (
          <label
            key={color.value}
            className="flex size-11 cursor-pointer items-center justify-center rounded-md hover:bg-surface-hover focus-within:outline-2 focus-within:outline-focus"
            title={color.label}
          >
            <input
              type="radio"
              className="sr-only"
              name={name}
              value={color.value}
              checked={value === color.value}
              onChange={() => onChange(color.value)}
              aria-label={color.label}
            />
            <span
              className={`size-6 rounded-full border-2 ${color.className} ${value === color.value ? 'border-text' : 'border-surface-raised'}`}
              aria-hidden="true"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
