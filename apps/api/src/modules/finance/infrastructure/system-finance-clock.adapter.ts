import { Injectable } from '@nestjs/common';
import type { FinanceClockPort } from '../domain/finance-clock.port.js';

@Injectable()
export class SystemFinanceClockAdapter implements FinanceClockPort {
  public now(): Date {
    return new Date();
  }
}
