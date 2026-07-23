import { Injectable } from '@nestjs/common';
import type { SchedulingClockPort } from '../domain/ports/scheduling-clock.port.js';

@Injectable()
export class SystemSchedulingClockAdapter implements SchedulingClockPort {
  public now(): Date {
    return new Date();
  }
}
