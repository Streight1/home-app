import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { CalendarTravelPlanService } from '../application/travel/calendar-travel-plan.service.js';
import { ListPreviousEventsService } from '../application/travel/list-previous-events.service.js';
import { PreviousEventQueryDto } from './dto/previous-event-query.dto.js';
import { UpsertTravelPlanDto } from './dto/upsert-travel-plan.dto.js';

@Controller('calendar/events/:eventId')
export class CalendarTravelController {
  public constructor(
    private readonly travel: CalendarTravelPlanService,
    private readonly previous: ListPreviousEventsService,
  ) {}
  @Get('travel-plans') public list(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.travel.list(principal.userId, eventId);
  }
  @Put('travel-plans/:travelerUserId') public configure(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Param('travelerUserId', new ParseUUIDPipe({ version: '4' }))
    travelerUserId: string,
    @Body() input: UpsertTravelPlanDto,
  ) {
    return this.travel.configure(
      principal.userId,
      eventId,
      travelerUserId,
      input,
    );
  }
  @Post('travel-plans/:travelerUserId/recalculate') public recalculate(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Param('travelerUserId', new ParseUUIDPipe({ version: '4' }))
    travelerUserId: string,
  ) {
    return this.travel.recalculate(principal.userId, eventId, travelerUserId);
  }
  @Get('travel-origin-candidates') public candidates(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Query() query: PreviousEventQueryDto,
  ) {
    return this.previous.execute(
      principal.userId,
      eventId,
      query.travelerUserId,
    );
  }
}
