import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  DECIMAL_QUANTITY_PATTERN,
  serializeDecimal,
} from '../src/common/numbers/decimal.js';
import {
  currentDateOnlyInTimeZone,
  dateOnlyToDatabase,
  formatDateOnly,
  isDateOnly,
  parseDateOnly,
  serializeDateOnly,
} from '../src/common/time/date-only.js';
import { IsDateOnly } from '../src/common/time/is-date-only.decorator.js';
import { localDateTimeCandidates } from '../src/common/time/zoned-date.js';
import {
  formatIsoDate,
  isoDateWeekday,
  parseIsoDate,
} from '../src/common/recurrence/date-recurrence.js';
import {
  dateOnly as bucketListDateOnly,
  dateOnlyString as bucketListDateOnlyString,
} from '../src/modules/bucket-list/domain/bucket-list.types.js';
import {
  dateOnly as financeDateOnly,
  dateOnlyString as financeDateOnlyString,
} from '../src/modules/finance/domain/finance.types.js';
import {
  maintenanceDate,
  maintenanceDateString,
} from '../src/modules/maintenance/domain/maintenance.types.js';
import {
  currentDateOnly as mealsCurrentDateOnly,
  dateOnly as mealsDateOnly,
  dateOnlyString as mealsDateOnlyString,
  DECIMAL_QUANTITY_PATTERN as MEALS_DECIMAL_QUANTITY_PATTERN,
} from '../src/modules/meals/domain/meals.types.js';
import { decimalString } from '../src/modules/meals/shared/measurement/decimal-quantity.js';
import {
  currentDateOnly as expeditionsCurrentDateOnly,
  dateOnly as expeditionsDateOnly,
  dateOnlyString as expeditionsDateOnlyString,
  DECIMAL_QUANTITY_PATTERN as EXPEDITIONS_DECIMAL_QUANTITY_PATTERN,
} from '../src/modules/expeditions/domain/expeditions.types.js';
import {
  dateOnlyDbValue,
  isoDateFromDb,
  isIsoDate,
  localIsoDate,
} from '../src/modules/tasks/domain/task-due-date.js';

describe('shared date-only primitive', () => {
  class DateOnlyFixture {
    @IsDateOnly() public value!: string;
  }

  it('parses, validates and formats actual Gregorian dates', () => {
    expect(parseDateOnly('2028-02-29')).toEqual({
      year: 2028,
      month: 2,
      day: 29,
    });
    expect(formatDateOnly({ year: 2028, month: 2, day: 9 })).toBe('2028-02-09');
    for (const value of [
      '2026-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-00-10',
      '0000-01-01',
      '2026-7-01',
      'not-a-date',
    ]) {
      expect(isDateOnly(value)).toBe(false);
      expect(() => parseDateOnly(value)).toThrow('INVALID_ISO_DATE');
    }
  });

  it('keeps database DATE values stable at Prague DST boundaries', () => {
    for (const value of ['2026-03-29', '2026-10-25', '2026-07-31']) {
      const stored = dateOnlyToDatabase(value);
      expect(stored.getUTCHours()).toBe(0);
      expect(serializeDateOnly(stored)).toBe(value);
    }
  });

  it('derives Prague calendar dates from instants without system locale', () => {
    const spring = new Date('2026-03-28T23:30:00.000Z');
    const autumn = new Date('2026-10-24T22:30:00.000Z');
    expect(currentDateOnlyInTimeZone(spring, 'Europe/Prague')).toBe(
      '2026-03-29',
    );
    expect(currentDateOnlyInTimeZone(autumn, 'Europe/Prague')).toBe(
      '2026-10-25',
    );
    expect(currentDateOnlyInTimeZone(spring, 'UTC')).toBe('2026-03-28');
  });

  it('keeps existing module exports on the canonical implementation', () => {
    const value = '2026-10-25';
    const moduleRoundTrips = [
      financeDateOnlyString(financeDateOnly(value)),
      bucketListDateOnlyString(bucketListDateOnly(value)),
      maintenanceDateString(maintenanceDate(value)),
      mealsDateOnlyString(mealsDateOnly(value)),
      expeditionsDateOnlyString(expeditionsDateOnly(value)),
      isoDateFromDb(dateOnlyDbValue(value)),
    ];
    expect(moduleRoundTrips).toEqual(
      Array(moduleRoundTrips.length).fill(value),
    );
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(() => dateOnlyDbValue('2026-02-29')).toThrow('INVALID_ISO_DATE');
  });

  it('uses the same date parser in recurrence and current-date wrappers', () => {
    expect(parseIsoDate('2026-07-31')).toEqual(parseDateOnly('2026-07-31'));
    expect(formatIsoDate(parseIsoDate('2026-07-31'))).toBe('2026-07-31');
    expect(() => parseIsoDate('2026-11-31')).toThrow('INVALID_ISO_DATE');
    const instant = new Date('2026-03-28T23:30:00.000Z');
    expect(localIsoDate(instant, 'Europe/Prague')).toBe('2026-03-29');
    expect(mealsCurrentDateOnly(instant, 'Europe/Prague')).toBe('2026-03-29');
    expect(expeditionsCurrentDateOnly(instant, 'Europe/Prague')).toBe(
      '2026-03-29',
    );
    expect(isoDateWeekday('0099-01-01')).toBe(4);
    const ancientCandidate = localDateTimeCandidates(
      '0099-01-01',
      '09:00',
      'UTC',
    );
    expect(ancientCandidate).toHaveLength(1);
    expect(ancientCandidate[0]?.getUTCFullYear()).toBe(99);
  });

  it('rejects impossible DTO dates before application services receive them', async () => {
    const valid = Object.assign(new DateOnlyFixture(), {
      value: '2028-02-29',
    });
    const impossible = Object.assign(new DateOnlyFixture(), {
      value: '2026-02-30',
    });
    const wrongShape = Object.assign(new DateOnlyFixture(), {
      value: '2026-2-03',
    });

    await expect(validate(valid)).resolves.toHaveLength(0);
    await expect(validate(impossible)).resolves.toHaveLength(1);
    await expect(validate(wrongShape)).resolves.toHaveLength(1);
  });
});

describe('shared Decimal serialization primitive', () => {
  it('serializes Prisma Decimal deterministically without float conversion', () => {
    expect(serializeDecimal(new Prisma.Decimal('1.500'))).toBe('1.5');
    expect(serializeDecimal(new Prisma.Decimal('0.125'))).toBe('0.125');
    expect(serializeDecimal(new Prisma.Decimal('10'))).toBe('10');
    expect(serializeDecimal(null)).toBeNull();
    expect(decimalString(new Prisma.Decimal('1.500'))).toBe('1.5');
  });

  it('shares only the quantity syntax between Meals and Expeditions', () => {
    expect(MEALS_DECIMAL_QUANTITY_PATTERN).toBe(DECIMAL_QUANTITY_PATTERN);
    expect(EXPEDITIONS_DECIMAL_QUANTITY_PATTERN).toBe(DECIMAL_QUANTITY_PATTERN);
    expect(DECIMAL_QUANTITY_PATTERN.test('1.125')).toBe(true);
    expect(DECIMAL_QUANTITY_PATTERN.test('1e3')).toBe(false);
    expect(DECIMAL_QUANTITY_PATTERN.test('-1')).toBe(false);
  });
});
