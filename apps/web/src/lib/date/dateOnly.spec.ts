import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  addDateOnlyDays,
  addLocalDays,
  currentLocalDateOnly,
  dateOnlyToLocalDate,
  formatDateOnly,
  formatLocalDateOnly,
  isDateOnly,
  parseDateOnly,
  startOfLocalWeek,
  startOfLocalMonth,
} from './dateOnly.js';

const originalTimeZone = process.env.TZ;

describe('frontend date-only primitive', () => {
  beforeAll(() => {
    process.env.TZ = 'Europe/Prague';
  });

  afterAll(() => {
    if (originalTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimeZone;
  });

  it('validates real Gregorian dates instead of only their shape', () => {
    expect(parseDateOnly('2028-02-29')).toEqual({
      year: 2028,
      month: 2,
      day: 29,
    });
    expect(formatDateOnly({ year: 2026, month: 7, day: 29 })).toBe(
      '2026-07-29',
    );
    expect(isDateOnly('2026-02-29')).toBe(false);
    expect(isDateOnly('2026-13-01')).toBe(false);
    expect(isDateOnly('2026-7-1')).toBe(false);
  });

  it('parses and serializes date-only values through local calendar fields', () => {
    const date = dateOnlyToLocalDate('2026-07-29');
    expect([
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
    ]).toEqual([2026, 7, 29, 0]);
    expect(formatLocalDateOnly(date)).toBe('2026-07-29');
    expect(currentLocalDateOnly(new Date(2026, 6, 29, 23, 30))).toBe(
      '2026-07-29',
    );
  });

  it('keeps the calendar day stable across Prague DST transitions', () => {
    expect(addDateOnlyDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDateOnlyDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDateOnlyDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDateOnlyDays('2026-10-25', 1)).toBe('2026-10-26');

    const spring = dateOnlyToLocalDate('2026-03-28');
    expect(formatLocalDateOnly(addLocalDays(spring, 2))).toBe('2026-03-30');
  });

  it('uses Monday as the single start-of-week convention', () => {
    const sunday = dateOnlyToLocalDate('2026-08-02');
    expect(formatLocalDateOnly(startOfLocalWeek(sunday))).toBe('2026-07-27');
  });

  it('preserves years 0001–0099 in local calendar helpers', () => {
    const ancient = dateOnlyToLocalDate('0099-01-01');
    expect(ancient.getFullYear()).toBe(99);
    expect(formatLocalDateOnly(startOfLocalMonth(ancient))).toBe('0099-01-01');
    expect(formatLocalDateOnly(startOfLocalWeek(ancient))).toBe('0098-12-29');
  });
});
