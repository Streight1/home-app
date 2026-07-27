import { Injectable } from '@nestjs/common';
import type {
  CalendarEventRecord,
  CalendarEventVisual,
  CalendarVisualColorToken,
} from '../../domain/calendar.types.js';

@Injectable()
export class CalendarEventVisualService {
  public resolve(
    event: Pick<
      CalendarEventRecord,
      'colorToken' | 'participants' | 'source' | 'type'
    >,
  ): CalendarEventVisual {
    const isShared = event.participants.length > 1;
    const colorToken: CalendarVisualColorToken =
      event.colorToken ??
      (isShared
        ? 'shared'
        : (event.participants[0]?.user.calendarColorToken ?? 'neutral'));
    const kind =
      event.source === 'TASK'
        ? 'TASK'
        : event.type === 'WORK_SHIFT'
          ? 'WORK_SHIFT'
          : 'EVENT';
    return {
      colorToken,
      backgroundToken: `calendar-${colorToken}-surface`,
      borderToken: `calendar-${colorToken}-border`,
      foregroundToken: `calendar-${colorToken}-foreground`,
      isShared,
      kind,
    };
  }
}
