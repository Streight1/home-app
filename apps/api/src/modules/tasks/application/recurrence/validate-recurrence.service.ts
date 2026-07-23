import { Injectable } from '@nestjs/common';
import { invalidTaskInput } from '../../domain/task.errors.js';
import type { RecurrenceRule } from '../../domain/recurrence-rule.js';
import { isValidTimezone } from '../../domain/zoned-date.js';

@Injectable()
export class ValidateRecurrenceService {
  public execute(input: {
    dueDate: string | null;
    timezone: string;
    rule: RecurrenceRule;
  }): void {
    const { dueDate, timezone, rule } = input;
    if (!isValidTimezone(timezone))
      throw invalidTaskInput('Časové pásmo není platné IANA timezone.');
    if (!Number.isInteger(rule.interval) || rule.interval < 1)
      throw invalidTaskInput('Interval opakování musí být alespoň 1.');
    if (rule.frequency !== 'NONE' && !dueDate)
      throw invalidTaskInput('Opakovaný úkol musí mít termín.');
    const days = [...new Set(rule.daysOfWeek)];
    if (days.some((day) => !Number.isInteger(day) || day < 1 || day > 7))
      throw invalidTaskInput('Dny opakování musí být v rozsahu 1 až 7.');
    if (rule.frequency === 'WEEKLY' && days.length === 0)
      throw invalidTaskInput('Týdenní opakování vyžaduje alespoň jeden den.');
    if (rule.frequency !== 'WEEKLY' && days.length > 0)
      throw invalidTaskInput(
        'Dny v týdnu lze použít pouze pro týdenní opakování.',
      );
    if (
      rule.dayOfMonth !== null &&
      (rule.frequency !== 'MONTHLY' ||
        !Number.isInteger(rule.dayOfMonth) ||
        rule.dayOfMonth < 1 ||
        rule.dayOfMonth > 31)
    )
      throw invalidTaskInput(
        'Den v měsíci lze použít pouze v rozsahu 1 až 31.',
      );
    if (
      rule.monthOfYear !== null &&
      (rule.frequency !== 'YEARLY' ||
        !Number.isInteger(rule.monthOfYear) ||
        rule.monthOfYear < 1 ||
        rule.monthOfYear > 12)
    )
      throw invalidTaskInput(
        'Měsíc ročního opakování musí být v rozsahu 1 až 12.',
      );
  }
}
