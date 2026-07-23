import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { CalendarPreferencesService } from '../application/preferences/calendar-preferences.service.js';
import { UpdateCalendarPreferencesDto } from './dto/update-calendar-preferences.dto.js';

@Controller('calendar/preferences')
export class CalendarPreferencesController {
  public constructor(
    private readonly preferences: CalendarPreferencesService,
  ) {}
  @Get() public get(@CurrentUser() principal: SessionPrincipal) {
    return this.preferences.get(principal.userId);
  }
  @Patch() public update(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: UpdateCalendarPreferencesDto,
  ) {
    return this.preferences.update(principal.userId, input);
  }
}
