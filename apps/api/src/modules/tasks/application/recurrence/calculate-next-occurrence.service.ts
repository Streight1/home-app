import { Injectable } from '@nestjs/common';
import type { NextOccurrenceInput } from '../../domain/recurrence-rule.js';
import {
  daysInMonth,
  getZonedParts,
  isoWeekday,
  shiftLocalDays,
  zonedPartsToInstant,
  type ZonedDateParts,
} from '../../domain/zoned-date.js';
import { localIsoDate } from '../../domain/task-due-date.js';
import { calculateNextDateOccurrence } from '../../../../common/recurrence/date-recurrence.js';

function monthly(parts: ZonedDateParts, interval: number, day: number | null) {
  const monthIndex = parts.month - 1 + interval;
  const year = parts.year + Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return {
    ...parts,
    year,
    month,
    day: Math.min(day ?? parts.day, daysInMonth(year, month)),
  };
}

function yearly(parts: ZonedDateParts, interval: number, month: number | null) {
  const year = parts.year + interval;
  const targetMonth = month ?? parts.month;
  return {
    ...parts,
    year,
    month: targetMonth,
    day: Math.min(parts.day, daysInMonth(year, targetMonth)),
  };
}

function weekly(
  parts: ZonedDateParts,
  interval: number,
  daysOfWeek: readonly number[],
): ZonedDateParts {
  const currentWeekday = isoWeekday(parts);
  for (let days = 1; days <= interval * 7 + 7; days += 1) {
    const candidate = shiftLocalDays(parts, days);
    if (!daysOfWeek.includes(isoWeekday(candidate))) continue;
    const weekOffset = Math.floor((currentWeekday - 1 + days) / 7);
    if (weekOffset === 0 || weekOffset % interval === 0) return candidate;
  }
  return shiftLocalDays(parts, interval * 7);
}

@Injectable()
export class CalculateNextOccurrenceService {
  public execute(input: NextOccurrenceInput): Date | null {
    const { rule } = input;
    if (rule.frequency === 'NONE') return null;
    const parts = getZonedParts(input.currentDueAt, input.timezone);
    const nextParts =
      rule.frequency === 'DAILY'
        ? shiftLocalDays(parts, rule.interval)
        : rule.frequency === 'WEEKLY'
          ? weekly(parts, rule.interval, rule.daysOfWeek)
          : rule.frequency === 'MONTHLY'
            ? monthly(parts, rule.interval, rule.dayOfMonth)
            : yearly(parts, rule.interval, rule.monthOfYear);
    const next = zonedPartsToInstant(nextParts, input.timezone);
    return rule.endsAt && next > rule.endsAt ? null : next;
  }

  public executeDateOnly(input: {
    currentDueDate: string;
    timezone: string;
    rule: NextOccurrenceInput['rule'];
  }): string | null {
    const { rule } = input;
    if (rule.frequency === 'NONE') return null;
    const endsOn = rule.endsAt
      ? localIsoDate(rule.endsAt, input.timezone)
      : null;
    return calculateNextDateOccurrence({
      currentDate: input.currentDueDate,
      anchorDate: input.currentDueDate,
      definition: {
        frequency: rule.frequency,
        interval: rule.interval,
        weekdays: rule.daysOfWeek,
        ...(rule.dayOfMonth ? { dayOfMonth: rule.dayOfMonth } : {}),
        ...(rule.monthOfYear ? { monthOfYear: rule.monthOfYear } : {}),
      },
      endsOn,
    });
  }
}
