import { getCalendarMonthCells } from '../../lib/calendarMonth.js';

const weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export function CalendarDaySelection({
  month,
  selected,
  onChange,
}: {
  month: string;
  selected: string[];
  onChange: (dates: string[]) => void;
}) {
  const days = getCalendarMonthCells(month);
  return (
    <div>
      <p className="mb-2 text-body-sm text-text-muted">
        Vyberte konkrétní dny. Všechny události se vytvoří v jedné transakci.
      </p>
      <div className="grid grid-cols-7 gap-1" aria-hidden="true">
        {weekdays.map((day) => (
          <span
            key={day}
            className="py-1 text-center text-caption font-semibold text-text-muted"
          >
            {day}
          </span>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-1"
        role="group"
        aria-label="Dny pro hromadné vložení"
      >
        {days.map((day) => {
          const value = day.isoDate;
          const active = selected.includes(value);
          if (!day.inMonth)
            return (
              <span
                key={value}
                aria-hidden="true"
                className="grid min-h-11 place-items-center rounded-md bg-surface-subtle text-body-sm tabular-nums text-text-muted"
              >
                {day.day}
              </span>
            );
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(
                  active
                    ? selected.filter((date) => date !== value)
                    : [...selected, value],
                )
              }
              className={`min-h-11 rounded-md border text-body-sm tabular-nums focus-visible:outline-2 focus-visible:outline-focus ${active ? 'border-primary bg-primary-soft text-primary-emphasis' : 'border-border hover:bg-surface-hover'}`}
            >
              {day.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
