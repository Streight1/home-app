import type { IngredientUnit } from '../../types/meals.types.js';

export const INGREDIENT_UNIT_OPTIONS: readonly [IngredientUnit, string][] = [
  ['G', 'g'],
  ['KG', 'kg'],
  ['ML', 'ml'],
  ['L', 'l'],
  ['TSP', 'lžička'],
  ['TBSP', 'lžíce'],
  ['CUP', 'hrnek'],
  ['PIECE', 'kus'],
  ['PACKAGE', 'balení'],
  ['SLICE', 'plátek'],
  ['PINCH', 'špetka'],
  ['AS_NEEDED', 'podle chuti'],
  ['CUSTOM', 'vlastní'],
];
