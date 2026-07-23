export const financeCurrencies = ['CZK', 'EUR'] as const;
export type FinanceCurrency = (typeof financeCurrencies)[number];

export const financialAccountTypes = [
  'CURRENT',
  'SAVINGS',
  'CREDIT_CARD',
  'CASH',
  'OTHER',
] as const;
export type FinancialAccountType = (typeof financialAccountTypes)[number];

export const financialCategoryKinds = ['EXPENSE', 'INCOME', 'BOTH'] as const;
export type FinancialCategoryKind = (typeof financialCategoryKinds)[number];

export const manualTransactionTypes = ['EXPENSE', 'INCOME'] as const;
export type ManualTransactionType = (typeof manualTransactionTypes)[number];
export const financialTransactionTypes = [
  'EXPENSE',
  'INCOME',
  'REFUND',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT',
] as const;
export type FinancialTransactionType =
  (typeof financialTransactionTypes)[number];

export const financeColorTokens = [
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'orange',
  'rose',
  'neutral',
] as const;
export type FinanceColorToken = (typeof financeColorTokens)[number];

export const financeIconKeys = [
  'wallet',
  'landmark',
  'coins',
  'home',
  'cart',
  'car',
  'heart',
  'receipt',
  'briefcase',
  'other',
] as const;
export type FinanceIconKey = (typeof financeIconKeys)[number];

export const financePageSizes = [10, 20, 50, 100] as const;
export const financeSortFields = ['bookedDate', 'createdAt', 'amount'] as const;
export const financeSortDirections = ['asc', 'desc'] as const;

export const recommendedFinanceCategories = [
  { name: 'Bydlení', kind: 'EXPENSE', colorToken: 'violet', iconKey: 'home' },
  { name: 'Potraviny', kind: 'EXPENSE', colorToken: 'green', iconKey: 'cart' },
  {
    name: 'Restaurace',
    kind: 'EXPENSE',
    colorToken: 'orange',
    iconKey: 'receipt',
  },
  { name: 'Doprava', kind: 'EXPENSE', colorToken: 'blue', iconKey: 'car' },
  { name: 'Vozidla', kind: 'EXPENSE', colorToken: 'blue', iconKey: 'car' },
  { name: 'Zdraví', kind: 'EXPENSE', colorToken: 'rose', iconKey: 'heart' },
  { name: 'Sport', kind: 'EXPENSE', colorToken: 'cyan', iconKey: 'other' },
  { name: 'Domácnost', kind: 'EXPENSE', colorToken: 'violet', iconKey: 'home' },
  {
    name: 'Elektronika',
    kind: 'EXPENSE',
    colorToken: 'blue',
    iconKey: 'other',
  },
  { name: 'Zábava', kind: 'EXPENSE', colorToken: 'orange', iconKey: 'other' },
  {
    name: 'Předplatné',
    kind: 'EXPENSE',
    colorToken: 'violet',
    iconKey: 'receipt',
  },
  { name: 'Dárky', kind: 'EXPENSE', colorToken: 'rose', iconKey: 'other' },
  { name: 'Ostatní', kind: 'EXPENSE', colorToken: 'neutral', iconKey: 'other' },
  { name: 'Mzda', kind: 'INCOME', colorToken: 'green', iconKey: 'briefcase' },
  {
    name: 'Vedlejší příjem',
    kind: 'INCOME',
    colorToken: 'cyan',
    iconKey: 'briefcase',
  },
  {
    name: 'Vrácení peněz',
    kind: 'INCOME',
    colorToken: 'blue',
    iconKey: 'coins',
  },
  {
    name: 'Ostatní příjem',
    kind: 'INCOME',
    colorToken: 'neutral',
    iconKey: 'coins',
  },
] as const;

export const normalizeFinanceName = (value: string): string =>
  value.trim().toLocaleLowerCase('cs-CZ').replace(/\s+/g, ' ');

export const dateOnly = (value: string): Date =>
  new Date(`${value}T00:00:00.000Z`);

export const dateOnlyString = (value: Date): string =>
  value.toISOString().slice(0, 10);
