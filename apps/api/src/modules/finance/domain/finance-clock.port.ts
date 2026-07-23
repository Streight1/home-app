export const FINANCE_CLOCK_PORT = Symbol('FINANCE_CLOCK_PORT');

export interface FinanceClockPort {
  now(): Date;
}
