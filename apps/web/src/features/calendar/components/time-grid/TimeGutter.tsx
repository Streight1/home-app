import { HOUR_HEIGHT_PX, MINUTES_PER_DAY } from './time-grid.constants.js';

export function TimeGutter() {
  return (
    <div
      className="sticky left-0 z-20 border-r border-border bg-surface-raised text-caption text-text-muted"
      style={{ height: MINUTES_PER_DAY * (HOUR_HEIGHT_PX / 60) }}
      aria-hidden="true"
    >
      {Array.from({ length: 24 }, (_, hour) => (
        <span
          key={hour}
          className="absolute right-2 -translate-y-1/2 tabular-nums"
          style={{ top: hour * HOUR_HEIGHT_PX }}
        >
          {String(hour).padStart(2, '0')}:00
        </span>
      ))}
    </div>
  );
}
