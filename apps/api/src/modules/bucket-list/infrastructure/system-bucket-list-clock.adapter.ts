import { Injectable } from '@nestjs/common';
import type { BucketListClock } from '../domain/bucket-list-clock.port.js';

@Injectable()
export class SystemBucketListClockAdapter implements BucketListClock {
  public now(): Date {
    return new Date();
  }
}
