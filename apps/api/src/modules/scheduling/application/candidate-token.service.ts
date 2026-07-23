import { createHmac, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../config/app-config.service.js';
import {
  travelRouteModes,
  type TravelRouteMode,
} from '../../location/travel-estimation.facade.js';
import { slotChanged } from '../domain/scheduling.errors.js';
import {
  SCHEDULING_CLOCK_PORT,
  type SchedulingClockPort,
} from '../domain/ports/scheduling-clock.port.js';

export interface SchedulingCandidateTokenPayload {
  taskId: string;
  startAt: string;
  endAt: string;
  windowStart: string;
  windowEnd: string;
  timezone: string;
  routeMode: TravelRouteMode;
  travelBufferMinutes: number;
  considerTravel: boolean;
  expiresAt: string;
  taskVersion: string;
  calendarVersion: string;
}

@Injectable()
export class CandidateTokenService {
  public constructor(
    private readonly config: AppConfigService,
    @Inject(SCHEDULING_CLOCK_PORT)
    private readonly clock: SchedulingClockPort,
  ) {}
  public sign(payload: SchedulingCandidateTokenPayload): string {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.config.internalHealthToken)
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${signature}`;
  }
  public verify(token: string): SchedulingCandidateTokenPayload {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) throw slotChanged();
    const expected = createHmac('sha256', this.config.internalHealthToken)
      .update(encoded)
      .digest();
    let actual: Buffer;
    try {
      actual = Buffer.from(signature, 'base64url');
    } catch {
      throw slotChanged();
    }
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw slotChanged();
    try {
      const parsed = JSON.parse(
        Buffer.from(encoded, 'base64url').toString('utf8'),
      ) as Partial<SchedulingCandidateTokenPayload>;
      if (
        typeof parsed.taskId !== 'string' ||
        typeof parsed.startAt !== 'string' ||
        typeof parsed.endAt !== 'string' ||
        typeof parsed.windowStart !== 'string' ||
        typeof parsed.windowEnd !== 'string' ||
        typeof parsed.timezone !== 'string' ||
        typeof parsed.routeMode !== 'string' ||
        !travelRouteModes.includes(parsed.routeMode) ||
        typeof parsed.travelBufferMinutes !== 'number' ||
        !Number.isInteger(parsed.travelBufferMinutes) ||
        parsed.travelBufferMinutes < 0 ||
        parsed.travelBufferMinutes > 240 ||
        typeof parsed.considerTravel !== 'boolean' ||
        typeof parsed.expiresAt !== 'string' ||
        typeof parsed.taskVersion !== 'string' ||
        typeof parsed.calendarVersion !== 'string'
      )
        throw slotChanged();
      if (new Date(parsed.expiresAt).getTime() <= this.clock.now().getTime())
        throw slotChanged();
      return parsed as SchedulingCandidateTokenPayload;
    } catch {
      throw slotChanged();
    }
  }
}
