import type { IngredientUnit, MealType } from '../types/meals.types.js';

const DECIMAL = /^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/;
const SCALE = 1000n;

const scaledInteger = (value: string) => {
  if (!DECIMAL.test(value)) throw new Error('Neplatné desetinné množství.');
  const [whole = '0', fraction = ''] = value.split('.');
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(3, '0'));
};

const decimalFromScaled = (value: bigint) => {
  const whole = value / SCALE;
  const fraction = (value % SCALE)
    .toString()
    .padStart(3, '0')
    .replace(/0+$/, '');
  return fraction ? `${String(whole)}.${fraction}` : whole.toString();
};

export function scaleDecimalQuantity(
  quantity: string | null,
  originalServings: string,
  requestedServings: string,
) {
  if (quantity === null) return null;
  const original = scaledInteger(originalServings);
  const requested = scaledInteger(requestedServings);
  if (original <= 0n || requested <= 0n)
    throw new Error('Počet porcí musí být kladný.');
  const numerator = scaledInteger(quantity) * requested;
  return decimalFromScaled((numerator + original / 2n) / original);
}

export const UNIT_LABELS: Record<IngredientUnit, string> = {
  G: 'g',
  KG: 'kg',
  ML: 'ml',
  L: 'l',
  TSP: 'lžička',
  TBSP: 'lžíce',
  CUP: 'hrnek',
  PIECE: 'kus',
  PACKAGE: 'balení',
  SLICE: 'plátek',
  PINCH: 'špetka',
  AS_NEEDED: 'podle chuti',
  CUSTOM: 'vlastní',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Snídaně',
  MORNING_SNACK: 'Dopolední svačina',
  LUNCH: 'Oběd',
  AFTERNOON_SNACK: 'Odpolední svačina',
  DINNER: 'Večeře',
  OTHER: 'Jiné',
};

export const localDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
};
