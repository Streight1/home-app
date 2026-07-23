export const workShiftPresets = [
  {
    key: 'day',
    label: 'Denní 08:00–20:00',
    start: '08:00',
    end: '20:00',
    endDayOffset: 0,
  },
  {
    key: 'night',
    label: 'Noční 20:00–08:00',
    start: '20:00',
    end: '08:00',
    endDayOffset: 1,
  },
  {
    key: 'morning',
    label: 'Ranní 08:00–14:00',
    start: '08:00',
    end: '14:00',
    endDayOffset: 0,
  },
  {
    key: 'afternoon',
    label: 'Odpolední 14:00–20:00',
    start: '14:00',
    end: '20:00',
    endDayOffset: 0,
  },
] as const;

export type WorkShiftPreset = (typeof workShiftPresets)[number];
