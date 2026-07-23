import { HOUR_HEIGHT_PX } from './time-grid.constants.js';

export function TimeGridLines() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 49 }, (_, halfHour) => (
        <span
          key={halfHour}
          className={`absolute inset-x-0 border-t ${halfHour % 2 === 0 ? 'border-border' : 'border-border/50'}`}
          style={{ top: halfHour * (HOUR_HEIGHT_PX / 2) }}
        />
      ))}
    </div>
  );
}
