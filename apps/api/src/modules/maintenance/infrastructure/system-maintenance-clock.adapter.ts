import { Injectable } from '@nestjs/common';
import type { MaintenanceClock } from '../domain/maintenance-clock.port.js';

@Injectable()
export class SystemMaintenanceClockAdapter implements MaintenanceClock {
  public now(): Date {
    return new Date();
  }
}
