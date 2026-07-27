import type { CalendarVisualColorToken } from '../../types/calendar.types.js';

export const calendarVisualClasses: Record<CalendarVisualColorToken, string> = {
  violet:
    'bg-calendar-violet-surface border-calendar-violet-border text-calendar-violet-foreground hover:bg-calendar-violet-hover data-[selected=true]:bg-calendar-violet-selected',
  blue: 'bg-calendar-blue-surface border-calendar-blue-border text-calendar-blue-foreground hover:bg-calendar-blue-hover data-[selected=true]:bg-calendar-blue-selected',
  cyan: 'bg-calendar-cyan-surface border-calendar-cyan-border text-calendar-cyan-foreground hover:bg-calendar-cyan-hover data-[selected=true]:bg-calendar-cyan-selected',
  green:
    'bg-calendar-green-surface border-calendar-green-border text-calendar-green-foreground hover:bg-calendar-green-hover data-[selected=true]:bg-calendar-green-selected',
  amber:
    'bg-calendar-amber-surface border-calendar-amber-border text-calendar-amber-foreground hover:bg-calendar-amber-hover data-[selected=true]:bg-calendar-amber-selected',
  orange:
    'bg-calendar-orange-surface border-calendar-orange-border text-calendar-orange-foreground hover:bg-calendar-orange-hover data-[selected=true]:bg-calendar-orange-selected',
  rose: 'bg-calendar-rose-surface border-calendar-rose-border text-calendar-rose-foreground hover:bg-calendar-rose-hover data-[selected=true]:bg-calendar-rose-selected',
  pink: 'bg-calendar-pink-surface border-calendar-pink-border text-calendar-pink-foreground hover:bg-calendar-pink-hover data-[selected=true]:bg-calendar-pink-selected',
  neutral:
    'bg-calendar-neutral-surface border-calendar-neutral-border text-calendar-neutral-foreground hover:bg-calendar-neutral-hover data-[selected=true]:bg-calendar-neutral-selected',
  shared:
    'bg-calendar-shared-surface border-calendar-shared-border text-calendar-shared-foreground hover:bg-calendar-shared-hover data-[selected=true]:bg-calendar-shared-selected',
};
