import { Injectable } from '@nestjs/common';
import type { ClockPort } from '../domain/ports/clock.port.js';

@Injectable()
export class SystemClockAdapter implements ClockPort {
  public now(): Date {
    return new Date();
  }
}
