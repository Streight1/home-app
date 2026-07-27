import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { CancelCalendarEventService } from '../application/events/cancel-calendar-event.service.js';
import { CreateCalendarEventService } from '../application/events/create-calendar-event.service.js';
import { DeleteCalendarEventService } from '../application/events/delete-calendar-event.service.js';
import { GetCalendarEventService } from '../application/events/get-calendar-event.service.js';
import { ListCalendarEventsService } from '../application/events/list-calendar-events.service.js';
import { UpdateCalendarEventService } from '../application/events/update-calendar-event.service.js';
import { CalendarFeedQueryDto } from './dto/calendar-feed-query.dto.js';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto.js';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto.js';
import {
  BulkDeleteCalendarEventsDto,
  BulkUpdateCalendarEventsDto,
  CalendarBulkSelectionDto,
} from './dto/bulk-calendar-events.dto.js';
import { PreviewBulkCalendarEventsService } from '../application/events/preview-bulk-calendar-events.service.js';
import { BulkUpdateCalendarEventsService } from '../application/events/bulk-update-calendar-events.service.js';
import { BulkDeleteCalendarEventsService } from '../application/events/bulk-delete-calendar-events.service.js';

@Controller('calendar/events')
export class CalendarEventsController {
  public constructor(
    private readonly createEvent: CreateCalendarEventService,
    private readonly updateEvent: UpdateCalendarEventService,
    private readonly getEvent: GetCalendarEventService,
    private readonly listEvents: ListCalendarEventsService,
    private readonly cancelEvent: CancelCalendarEventService,
    private readonly deleteEvent: DeleteCalendarEventService,
    private readonly previewBulk: PreviewBulkCalendarEventsService,
    private readonly updateBulk: BulkUpdateCalendarEventsService,
    private readonly deleteBulk: BulkDeleteCalendarEventsService,
  ) {}
  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateCalendarEventDto,
  ) {
    return this.createEvent.execute(principal.userId, input);
  }
  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: CalendarFeedQueryDto,
  ) {
    return this.listEvents.execute(principal.userId, query.from, query.to);
  }
  @Post('bulk-preview')
  public bulkPreview(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CalendarBulkSelectionDto,
  ) {
    return this.previewBulk.execute(principal.userId, input.eventIds);
  }
  @Patch('bulk-update')
  public bulkUpdate(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: BulkUpdateCalendarEventsDto,
  ) {
    return this.updateBulk.execute(principal.userId, input);
  }
  @Post('bulk-delete')
  public bulkDelete(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: BulkDeleteCalendarEventsDto,
  ) {
    return this.deleteBulk.execute(principal.userId, input.eventIds);
  }
  @Get(':eventId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.getEvent.execute(principal.userId, eventId);
  }
  @Patch(':eventId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Body() input: UpdateCalendarEventDto,
  ) {
    return this.updateEvent.execute(principal.userId, eventId, input);
  }
  @Post(':eventId/cancel')
  public cancel(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.cancelEvent.execute(principal.userId, eventId);
  }
  @Delete(':eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    await this.deleteEvent.execute(principal.userId, eventId);
  }
}
