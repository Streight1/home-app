import type { RecurrenceFrequency } from './task-status.js';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek: readonly number[];
  dayOfMonth: number | null;
  monthOfYear: number | null;
  endsAt: Date | null;
}

export interface NextOccurrenceInput {
  currentDueAt: Date;
  timezone: string;
  rule: RecurrenceRule;
}

export function isRecurring(rule: RecurrenceRule): boolean {
  return rule.frequency !== 'NONE';
}
