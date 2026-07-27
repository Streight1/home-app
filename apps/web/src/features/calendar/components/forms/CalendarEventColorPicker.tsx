import type { CalendarColorToken } from '../../types/calendar.types.js';
import { calendarVisualClasses } from '../calendar/calendarVisualClasses.js';

const options: { value: CalendarColorToken | null; label: string }[] = [
  { value: null, label: 'Automaticky podle účastníka' },
  { value: 'violet', label: 'Fialová' },
  { value: 'blue', label: 'Modrá' },
  { value: 'cyan', label: 'Tyrkysová' },
  { value: 'green', label: 'Zelená' },
  { value: 'amber', label: 'Jantarová' },
  { value: 'orange', label: 'Oranžová' },
  { value: 'rose', label: 'Růžovočervená' },
  { value: 'pink', label: 'Růžová' },
];

export function CalendarEventColorPicker({
  value,
  fallback = 'neutral',
  onChange,
}: {
  value: CalendarColorToken | null;
  fallback?: 'neutral' | 'shared' | CalendarColorToken;
  onChange: (value: CalendarColorToken | null) => void;
}) {
  return (
    <fieldset className="grid gap-3 sm:col-span-2">
      <legend className="text-body-sm font-medium">Barva události</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup">
        {options.map((option) => {
          const selected = option.value === value;
          const token = option.value ?? fallback;
          return (
            <label
              key={option.value ?? 'automatic'}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-body-sm focus-within:outline-2 focus-within:outline-focus ${calendarVisualClasses[token]}`}
            >
              <input
                type="radio"
                name="calendar-event-color"
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <div
        className={`rounded-md border border-l-4 p-3 text-body-sm font-semibold ${calendarVisualClasses[value ?? fallback]}`}
        aria-live="polite"
      >
        Náhled podbarvení události
      </div>
    </fieldset>
  );
}
