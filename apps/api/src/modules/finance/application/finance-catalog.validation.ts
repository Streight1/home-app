import { financeConflict, financeInvalid } from '../domain/finance.errors.js';

export const financeCatalogConflictFrom = (
  error: unknown,
  message: string,
): Error => {
  if (error instanceof Error && 'code' in error && error.code === 'P2002')
    return financeConflict(message);
  return error instanceof Error ? error : financeConflict(message);
};

export function validateCreditCardFields(
  type: string,
  input: {
    creditLimitMinor?: string | null;
    statementDayOfMonth?: number | null;
    paymentDueDayOfMonth?: number | null;
    maskedIdentifier?: string | null;
  },
): void {
  const hasCreditCardFields =
    input.creditLimitMinor !== undefined && input.creditLimitMinor !== null;
  if (type !== 'CREDIT_CARD' && hasCreditCardFields)
    throw financeInvalid('Kreditní limit lze nastavit pouze kreditnímu účtu.');
  if (
    type !== 'CREDIT_CARD' &&
    (input.statementDayOfMonth ||
      input.paymentDueDayOfMonth ||
      input.maskedIdentifier)
  )
    throw financeInvalid(
      'Údaje kreditní karty lze nastavit pouze kreditnímu účtu.',
    );
}
