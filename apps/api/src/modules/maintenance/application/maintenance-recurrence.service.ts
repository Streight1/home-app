import { Injectable } from '@nestjs/common';
import {
  calculateNextDateOccurrence,
  type DateRecurrenceDefinition,
} from '../../../common/recurrence/date-recurrence.js';
import { addIsoDateDays } from '../../../common/time/zoned-date.js';
import { maintenanceInvalid } from '../domain/maintenance.errors.js';
import type { MaintenanceRecurrenceDto } from '../presentation/dto/maintenance.dto.js';

@Injectable()
export class MaintenanceRecurrenceService {
  public validate(
    recurrence: MaintenanceRecurrenceDto,
    startsOn: string,
    endsOn?: string | null,
  ): DateRecurrenceDefinition {
    if (endsOn && endsOn < startsOn)
      throw maintenanceInvalid('Konec plánu nesmí být před začátkem.');
    if (recurrence.frequency === 'WEEKLY' && !recurrence.weekdays?.length)
      throw maintenanceInvalid('Týdenní opakování vyžaduje alespoň jeden den.');
    if (recurrence.frequency === 'CUSTOM_MONTHS' && !recurrence.months?.length)
      throw maintenanceInvalid('Vyberte alespoň jeden měsíc.');
    if (
      (recurrence.ordinal === undefined) !==
      (recurrence.weekday === undefined)
    )
      throw maintenanceInvalid(
        'Pořadí v měsíci a den v týdnu musí být vyplněné společně.',
      );
    if (
      recurrence.ordinal !== undefined &&
      !['MONTHLY', 'YEARLY', 'CUSTOM_MONTHS'].includes(recurrence.frequency)
    )
      throw maintenanceInvalid(
        'Pořadový den v týdnu lze použít jen pro měsíční nebo roční plán.',
      );
    return {
      frequency: recurrence.frequency,
      interval: recurrence.interval,
      ...(recurrence.weekdays ? { weekdays: recurrence.weekdays } : {}),
      ...(recurrence.dayOfMonth ? { dayOfMonth: recurrence.dayOfMonth } : {}),
      ...(recurrence.monthOfYear
        ? { monthOfYear: recurrence.monthOfYear }
        : {}),
      ...(recurrence.months ? { months: recurrence.months } : {}),
      ...(recurrence.ordinal !== undefined
        ? { ordinal: recurrence.ordinal }
        : {}),
      ...(recurrence.weekday ? { weekday: recurrence.weekday } : {}),
    };
  }

  public next(input: {
    currentDate: string;
    startsOn: string;
    endsOn: string | null;
    recurrence: DateRecurrenceDefinition;
  }): string | null {
    return calculateNextDateOccurrence({
      currentDate: input.currentDate,
      anchorDate: input.startsOn,
      definition: input.recurrence,
      endsOn: input.endsOn,
    });
  }

  public planningWindow(input: {
    startsOn: string;
    today: string;
    endsOn: string | null;
    recurrence: DateRecurrenceDefinition;
    recurrenceBasis: 'FROM_SCHEDULED_DATE' | 'FROM_COMPLETION_DATE';
  }): string[] {
    if (
      input.recurrence.frequency === 'ONCE' ||
      input.recurrenceBasis === 'FROM_COMPLETION_DATE'
    )
      return [input.startsOn];
    const horizon = addIsoDateDays(input.today, 90);
    const dates: string[] = [];
    let cursor = input.startsOn;
    let lastBeforeToday: string | null =
      input.startsOn < input.today ? input.startsOn : null;
    if (input.startsOn >= input.today && input.startsOn <= horizon)
      dates.push(input.startsOn);
    for (
      let attempts = 0;
      attempts < 20_000 && dates.length < 3;
      attempts += 1
    ) {
      const next = this.next({
        currentDate: cursor,
        startsOn: input.startsOn,
        endsOn: input.endsOn,
        recurrence: input.recurrence,
      });
      if (!next || next > horizon) break;
      cursor = next;
      if (next < input.today) lastBeforeToday = next;
      else dates.push(next);
    }
    if (lastBeforeToday) dates.unshift(lastBeforeToday);
    return [...new Set(dates)].slice(0, 3);
  }
}
