import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { GetCalendarFeedService } from '../application/feed/get-calendar-feed.service.js';
import { GetTodayCalendarSummaryService } from '../application/feed/get-today-calendar-summary.service.js';
import {
  CalendarDashboardQueryDto,
  CalendarFeedQueryDto,
} from './dto/calendar-feed-query.dto.js';

@Controller('calendar')
export class CalendarFeedController {
  public constructor(
    private readonly feed: GetCalendarFeedService,
    private readonly dashboard: GetTodayCalendarSummaryService,
  ) {}
  @Get('feed')
  public getFeed(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: CalendarFeedQueryDto,
  ) {
    return this.feed.execute(principal.userId, query.from, query.to);
  }
  @Get('dashboard')
  public getDashboard(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: CalendarDashboardQueryDto,
  ) {
    return this.dashboard.execute(principal.userId, query.timezone);
  }
}
