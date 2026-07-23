import { Injectable } from '@nestjs/common';
import type { CalendarClockPort } from '../domain/ports/clock.port.js';

@Injectable()
export class SystemCalendarClockAdapter implements CalendarClockPort {
  public now(): Date {
    return new Date();
  }
}
