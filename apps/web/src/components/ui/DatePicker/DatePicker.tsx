import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';
import { IconButton } from '../IconButton/IconButton.js';

const weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'] as const;
const isoDate = (year: number, month: number, day: number) =>
  `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const selectedMonth = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
};

export const datePickerLabel = (value: string) => {
  if (!value) return 'Vybrat datum';
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long' }).format(
    new Date(year, month - 1, day),
  );
};

export function DatePicker({
  label,
  value,
  error,
  calendarLabel,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  calendarLabel?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => selectedMonth(value));
  const days = useMemo(() => {
    const leading = (month.getDay() + 6) % 7;
    const count = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: count }, (_, index) => index + 1),
    ];
  }, [month]);
  const now = new Date();
  const today = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
  return (
    <div className="grid gap-2">
      <span className="text-body-sm font-medium text-text">{label}</span>
      <Dialog
        title={`Vyberte ${label.toLocaleLowerCase('cs-CZ')}`}
        size="sm"
        mobileFullScreen
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) setMonth(selectedMonth(value));
        }}
        trigger={
          <Button
            type="button"
            className={`w-full justify-start ${error ? 'border-danger' : ''}`}
            aria-label={`${label}: ${datePickerLabel(value)}`}
            aria-invalid={error ? true : undefined}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {datePickerLabel(value)}
          </Button>
        }
      >
        <div className="mx-auto grid max-w-sm gap-4">
          <div className="flex items-center justify-between gap-3">
            <IconButton
              aria-label="Předchozí měsíc"
              onClick={() =>
                setMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </IconButton>
            <strong className="text-section-title capitalize">
              {new Intl.DateTimeFormat('cs-CZ', {
                month: 'long',
                year: 'numeric',
              }).format(month)}
            </strong>
            <IconButton
              aria-label="Následující měsíc"
              onClick={() =>
                setMonth(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </IconButton>
          </div>
          <div
            className="grid grid-cols-7 gap-1"
            role="grid"
            aria-label={calendarLabel ?? `Kalendář: ${label}`}
          >
            {weekdays.map((weekday) => (
              <span
                key={weekday}
                className="grid min-h-8 place-items-center text-caption font-medium text-text-muted"
                role="columnheader"
              >
                {weekday}
              </span>
            ))}
            {days.map((day, index) => {
              if (day === null)
                return (
                  <span key={`empty-${String(index)}`} aria-hidden="true" />
                );
              const candidate = isoDate(
                month.getFullYear(),
                month.getMonth(),
                day,
              );
              const selected = candidate === value;
              return (
                <button
                  key={candidate}
                  type="button"
                  role="gridcell"
                  aria-selected={selected}
                  aria-current={candidate === today ? 'date' : undefined}
                  aria-label={datePickerLabel(candidate)}
                  className={`min-h-11 rounded-md border text-body-sm transition-colors focus-visible:outline-2 focus-visible:outline-focus ${selected ? 'border-primary bg-selected-surface font-semibold text-text' : 'border-transparent text-text hover:bg-surface-hover'}`}
                  onClick={() => {
                    onChange(candidate);
                    setOpen(false);
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </Dialog>
      {error ? <span className="text-caption text-danger">{error}</span> : null}
    </div>
  );
}
