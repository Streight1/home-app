import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { PreviewTravelEstimateService } from '../application/travel/preview-travel-estimate.service.js';
import { TravelEstimateDto } from './dto/travel-estimate.dto.js';

@Controller('calendar/travel-estimate')
export class CalendarTravelEstimateController {
  public constructor(private readonly preview: PreviewTravelEstimateService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  public calculate(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: TravelEstimateDto,
  ) {
    return this.preview.execute(principal.userId, input);
  }
}
