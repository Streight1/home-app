import { describe, expect, it } from 'vitest';
import { CalculateNextOccurrenceService } from '../src/modules/tasks/application/recurrence/calculate-next-occurrence.service.js';
import { ValidateRecurrenceService } from '../src/modules/tasks/application/recurrence/validate-recurrence.service.js';
import type { RecurrenceRule } from '../src/modules/tasks/domain/recurrence-rule.js';
import {
  getZonedParts,
  zonedDayBounds,
} from '../src/modules/tasks/domain/zoned-date.js';

const calculate = new CalculateNextOccurrenceService();

function rule(patch: Partial<RecurrenceRule>): RecurrenceRule {
  return {
    frequency: 'DAILY',
    interval: 1,
    daysOfWeek: [],
    dayOfMonth: null,
    monthOfYear: null,
    endsAt: null,
    ...patch,
  };
}

describe('agenda recurrence calculations', () => {
  it('respects a daily interval', () => {
    expect(
      calculate.execute({
        currentDueAt: new Date('2026-07-15T08:00:00.000Z'),
        timezone: 'Europe/Prague',
        rule: rule({ interval: 2 }),
      }),
    ).toEqual(new Date('2026-07-17T08:00:00.000Z'));
  });

  it('preserves local time across daylight saving changes', () => {
    const next = calculate.execute({
      currentDueAt: new Date('2026-03-28T08:00:00.000Z'),
      timezone: 'Europe/Prague',
      rule: rule({}),
    });
    expect(next).toEqual(new Date('2026-03-29T07:00:00.000Z'));
    if (!next) throw new Error('Expected a next occurrence.');
    expect(getZonedParts(next, 'Europe/Prague').hour).toBe(9);
  });

  it('uses selected weekly days', () => {
    expect(
      calculate.execute({
        currentDueAt: new Date('2026-07-15T10:00:00.000Z'),
        timezone: 'UTC',
        rule: rule({ frequency: 'WEEKLY', daysOfWeek: [5] }),
      }),
    ).toEqual(new Date('2026-07-17T10:00:00.000Z'));
  });

  it('respects a multi-week interval', () => {
    expect(
      calculate.execute({
        currentDueAt: new Date('2026-07-17T10:00:00.000Z'),
        timezone: 'UTC',
        rule: rule({ frequency: 'WEEKLY', interval: 2, daysOfWeek: [1] }),
      }),
    ).toEqual(new Date('2026-07-27T10:00:00.000Z'));
  });

  it('clamps a monthly day 31 to the last valid day', () => {
    expect(
      calculate.execute({
        currentDueAt: new Date('2026-01-31T09:00:00.000Z'),
        timezone: 'UTC',
        rule: rule({ frequency: 'MONTHLY', dayOfMonth: 31 }),
      }),
    ).toEqual(new Date('2026-02-28T09:00:00.000Z'));
  });

  it('handles yearly recurrence across a leap year', () => {
    expect(
      calculate.execute({
        currentDueAt: new Date('2024-02-29T09:00:00.000Z'),
        timezone: 'UTC',
        rule: rule({ frequency: 'YEARLY', monthOfYear: 2 }),
      }),
    ).toEqual(new Date('2025-02-28T09:00:00.000Z'));
  });

  it('stops when the next occurrence exceeds recurrenceEndsAt', () => {
    expect(
      calculate.execute({
        currentDueAt: new Date('2026-07-15T09:00:00.000Z'),
        timezone: 'UTC',
        rule: rule({ endsAt: new Date('2026-07-15T23:59:00.000Z') }),
      }),
    ).toBeNull();
  });

  it('keeps daily and weekly date-only recurrences date-only', () => {
    expect(
      calculate.executeDateOnly({
        currentDueDate: '2026-07-15',
        timezone: 'Europe/Prague',
        rule: rule({ frequency: 'DAILY' }),
      }),
    ).toBe('2026-07-16');
    expect(
      calculate.executeDateOnly({
        currentDueDate: '2026-07-15',
        timezone: 'Europe/Prague',
        rule: rule({ frequency: 'WEEKLY', daysOfWeek: [5] }),
      }),
    ).toBe('2026-07-17');
  });

  it('clamps a monthly date-only recurrence to the final day', () => {
    expect(
      calculate.executeDateOnly({
        currentDueDate: '2026-01-31',
        timezone: 'Europe/Prague',
        rule: rule({ frequency: 'MONTHLY', dayOfMonth: 31 }),
      }),
    ).toBe('2026-02-28');
  });

  it('rejects weekly recurrence without a selected day', () => {
    expect(() =>
      new ValidateRecurrenceService().execute({
        dueDate: '2026-07-15',
        timezone: 'Europe/Prague',
        rule: rule({ frequency: 'WEEKLY', daysOfWeek: [] }),
      }),
    ).toThrow(expect.objectContaining({ code: 'TASK_INVALID_INPUT' }));
  });

  it('rejects recurrence without a due date and an invalid timezone', () => {
    const validate = new ValidateRecurrenceService();
    expect(() =>
      validate.execute({
        dueDate: null,
        timezone: 'Europe/Prague',
        rule: rule({}),
      }),
    ).toThrow();
    expect(() =>
      validate.execute({
        dueDate: '2026-07-15',
        timezone: 'Invalid/HomeApp',
        rule: rule({}),
      }),
    ).toThrow();
  });

  it('computes today boundaries in the requested timezone', () => {
    const bounds = zonedDayBounds(
      new Date('2026-07-15T22:30:00.000Z'),
      'Europe/Prague',
    );
    expect(bounds.start).toEqual(new Date('2026-07-15T22:00:00.000Z'));
    expect(bounds.end).toEqual(new Date('2026-07-16T21:59:59.999Z'));
  });
});
