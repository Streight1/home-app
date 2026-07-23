import { useEffect, useState } from 'react';
import {
  getMinutesSinceStartOfDay,
  getSegmentTopPx,
} from './time-grid.layout.js';

function sameDay(left: Date, right: Date): boolean {
  return left.toDateString() === right.toDateString();
}

export function CurrentTimeIndicator({ day }: { day: Date }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!sameDay(day, now)) return null;
  return (
    <div
      role="img"
      className="pointer-events-none absolute inset-x-0 z-30 border-t-2 border-danger"
      style={{ top: getSegmentTopPx(getMinutesSinceStartOfDay(now, day)) }}
      aria-label={`Aktuální čas ${now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`}
    >
      <span className="absolute -left-1 -top-1 size-2 rounded-full bg-danger" />
    </div>
  );
}
