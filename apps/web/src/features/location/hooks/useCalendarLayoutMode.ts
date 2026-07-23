import { useEffect, useState } from 'react';
import type { CalendarLayoutMode } from '../types/location.types.js';

function currentLayout(): CalendarLayoutMode {
  if (window.matchMedia('(min-width: 1200px)').matches) return 'expanded';
  if (window.matchMedia('(min-width: 768px)').matches) return 'medium';
  return 'compact';
}
export function useCalendarLayoutMode() {
  const [layout, setLayout] = useState(currentLayout);
  useEffect(() => {
    const compact = window.matchMedia('(max-width: 767px)');
    const expanded = window.matchMedia('(min-width: 1200px)');
    const update = () => setLayout(currentLayout());
    compact.addEventListener('change', update);
    expanded.addEventListener('change', update);
    return () => {
      compact.removeEventListener('change', update);
      expanded.removeEventListener('change', update);
    };
  }, []);
  return layout;
}
