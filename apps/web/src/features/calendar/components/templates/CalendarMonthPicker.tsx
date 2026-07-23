import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  calendarMonthValue,
  formatCalendarMonth,
  parseCalendarMonth,
  shiftCalendarMonth,
} from '../../lib/calendarMonth.js';
import { CalendarDaySelection } from './CalendarDaySelection.js';

const monthLabels = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat('cs-CZ', { month: 'long' }).format(
    new Date(2026, index, 1),
  ),
);

export function CalendarMonthPicker({
  month,
  selected,
  onMonthChange,
  onSelectionChange,
}: {
  month: string;
  selected: string[];
  onMonthChange: (month: string) => void;
  onSelectionChange: (dates: string[]) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const parsed = parseCalendarMonth(month);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 11 },
    (_, index) => currentYear - 5 + index,
  );
  const updatePart = (next: { year?: number; month?: number }) => {
    const year = next.year ?? parsed?.year ?? currentYear;
    const monthNumber = next.month ?? parsed?.month ?? 1;
    onMonthChange(`${String(year)}-${String(monthNumber).padStart(2, '0')}`);
  };
  return (
    <section className="grid gap-3" aria-label="Výběr dní v měsíci">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          aria-label="Předchozí měsíc"
          onClick={() => onMonthChange(shiftCalendarMonth(month, -1))}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          aria-expanded={choosing}
          onClick={() => setChoosing((value) => !value)}
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          {formatCalendarMonth(month)}
        </Button>
        <Button
          variant="ghost"
          aria-label="Následující měsíc"
          onClick={() => onMonthChange(shiftCalendarMonth(month, 1))}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {choosing ? (
        <div className="grid gap-3 rounded-md border border-border bg-surface-subtle p-3 sm:grid-cols-[1fr_8rem_auto]">
          <Select
            label="Měsíc"
            value={String(parsed?.month ?? 1)}
            onChange={(event) =>
              updatePart({ month: Number(event.target.value) })
            }
          >
            {monthLabels.map((label, index) => (
              <option key={label} value={index + 1}>
                {label.charAt(0).toLocaleUpperCase('cs-CZ') + label.slice(1)}
              </option>
            ))}
          </Select>
          <Select
            label="Rok"
            value={String(parsed?.year ?? currentYear)}
            onChange={(event) =>
              updatePart({ year: Number(event.target.value) })
            }
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
          <Button onClick={() => onMonthChange(calendarMonthValue(new Date()))}>
            Aktuální měsíc
          </Button>
        </div>
      ) : null}
      <CalendarDaySelection
        month={month}
        selected={selected}
        onChange={onSelectionChange}
      />
    </section>
  );
}
