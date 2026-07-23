import { Injectable } from '@nestjs/common';
import type { NextOccurrenceInput } from '../../domain/recurrence-rule.js';
import {
  addIsoDateDays,
  daysInMonth,
  getZonedParts,
  isoWeekday,
  shiftLocalDays,
  zonedPartsToInstant,
  type ZonedDateParts,
} from '../../domain/zoned-date.js';
import { localIsoDate } from '../../domain/task-due-date.js';

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
    const [year, month, day] = input.currentDueDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    let next: string;
    if (rule.frequency === 'DAILY') {
      next = addIsoDateDays(input.currentDueDate, rule.interval);
    } else if (rule.frequency === 'WEEKLY') {
      next = this.nextWeeklyDate(
        input.currentDueDate,
        rule.interval,
        rule.daysOfWeek,
      );
    } else if (rule.frequency === 'MONTHLY') {
      const monthIndex = month - 1 + rule.interval;
      const targetYear = year + Math.floor(monthIndex / 12);
      const targetMonth = (monthIndex % 12) + 1;
      next = this.isoDate(
        targetYear,
        targetMonth,
        Math.min(rule.dayOfMonth ?? day, daysInMonth(targetYear, targetMonth)),
      );
    } else {
      const targetYear = year + rule.interval;
      const targetMonth = rule.monthOfYear ?? month;
      next = this.isoDate(
        targetYear,
        targetMonth,
        Math.min(day, daysInMonth(targetYear, targetMonth)),
      );
    }
    const endsOn = rule.endsAt
      ? localIsoDate(rule.endsAt, input.timezone)
      : null;
    return endsOn && next > endsOn ? null : next;
  }

  private nextWeeklyDate(
    current: string,
    interval: number,
    daysOfWeek: readonly number[],
  ): string {
    const currentWeekday = this.isoWeekday(current);
    for (let days = 1; days <= interval * 7 + 7; days += 1) {
      const candidate = addIsoDateDays(current, days);
      if (!daysOfWeek.includes(this.isoWeekday(candidate))) continue;
      const weekOffset = Math.floor((currentWeekday - 1 + days) / 7);
      if (weekOffset === 0 || weekOffset % interval === 0) return candidate;
    }
    return addIsoDateDays(current, interval * 7);
  }

  private isoWeekday(value: string): number {
    const day = new Date(`${value}T00:00:00.000Z`).getUTCDay();
    return day === 0 ? 7 : day;
  }

  private isoDate(year: number, month: number, day: number): string {
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
}
