import { Prisma } from '../../../../generated/prisma/client.js';
import { serializeDecimal } from '../../../../common/numbers/decimal.js';
import { mealsInvalid } from '../../domain/meals.errors.js';
import {
  DECIMAL_QUANTITY_PATTERN,
  type INGREDIENT_UNITS,
} from '../../domain/meals.types.js';

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export function decimalQuantity(
  value: string,
  field = 'Množství',
): Prisma.Decimal {
  if (!DECIMAL_QUANTITY_PATTERN.test(value))
    throw mealsInvalid(`${field} musí být nezáporné desetinné číslo.`);
  const decimal = new Prisma.Decimal(value);
  if (!decimal.isFinite()) throw mealsInvalid(`${field} není platné.`);
  return decimal;
}

export const decimalString = (value: Prisma.Decimal | null) =>
  serializeDecimal(value);

export function scaleQuantity(
  quantity: string | null,
  originalServings: string,
  requestedServings: string,
) {
  if (quantity === null) return null;
  const original = decimalQuantity(originalServings, 'Počet porcí');
  if (original.lte(0)) throw mealsInvalid('Počet porcí musí být kladný.');
  const requested = decimalQuantity(requestedServings, 'Počet porcí');
  if (requested.lte(0)) throw mealsInvalid('Počet porcí musí být kladný.');
  return decimalString(
    decimalQuantity(quantity).mul(requested).div(original).toDecimalPlaces(3),
  );
}

interface Measured {
  quantity: string | null;
  unit: IngredientUnit;
  customUnitLabel?: string | null;
}

const dimension = (unit: IngredientUnit) => {
  if (unit === 'G' || unit === 'KG') return 'mass';
  if (unit === 'ML' || unit === 'L') return 'volume';
  return unit;
};

const factor = (unit: IngredientUnit) =>
  unit === 'KG' || unit === 'L'
    ? new Prisma.Decimal(1000)
    : new Prisma.Decimal(1);

export function canMergeMeasurements(a: Measured, b: Measured) {
  if (a.quantity === null || b.quantity === null) return false;
  if (a.unit === 'AS_NEEDED' || b.unit === 'AS_NEEDED') return false;
  if (a.unit === 'CUSTOM' || b.unit === 'CUSTOM')
    return (
      a.unit === b.unit &&
      Boolean(a.customUnitLabel) &&
      a.customUnitLabel === b.customUnitLabel
    );
  return dimension(a.unit) === dimension(b.unit);
}

export function mergeMeasurements(a: Measured, b: Measured): Measured {
  if (!canMergeMeasurements(a, b))
    throw mealsInvalid('Nekompatibilní jednotky nelze sloučit.');
  const base = decimalQuantity(a.quantity ?? '0')
    .mul(factor(a.unit))
    .add(decimalQuantity(b.quantity ?? '0').mul(factor(b.unit)));
  const baseDimension = dimension(a.unit);
  const useLarge =
    (baseDimension === 'mass' || baseDimension === 'volume') && base.gte(1000);
  const unit: IngredientUnit =
    baseDimension === 'mass'
      ? useLarge
        ? 'KG'
        : 'G'
      : baseDimension === 'volume'
        ? useLarge
          ? 'L'
          : 'ML'
        : a.unit;
  return {
    quantity: decimalString(base.div(factor(unit)).toDecimalPlaces(3)),
    unit,
    ...(unit === 'CUSTOM' ? { customUnitLabel: a.customUnitLabel } : {}),
  };
}

export function subtractMeasurements(required: Measured, available: Measured) {
  if (!canMergeMeasurements(required, available))
    return { remaining: required, compatible: false };
  const requiredBase = decimalQuantity(required.quantity ?? '0').mul(
    factor(required.unit),
  );
  const availableBase = decimalQuantity(available.quantity ?? '0').mul(
    factor(available.unit),
  );
  const remainingBase = Prisma.Decimal.max(
    new Prisma.Decimal(0),
    requiredBase.sub(availableBase),
  );
  return {
    compatible: true,
    remaining: {
      ...required,
      quantity: decimalString(
        remainingBase.div(factor(required.unit)).toDecimalPlaces(3),
      ),
    },
  };
}
