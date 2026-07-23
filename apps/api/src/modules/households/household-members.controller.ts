import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { IsIn } from 'class-validator';
import { CurrentUser } from '../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../auth/session/authenticated-request.js';
import { HouseholdMembersService } from './household-members.service.js';
import {
  calendarMemberColorTokens,
  type CalendarMemberColorToken,
} from './household.types.js';

class UpdateCalendarColorDto {
  @IsIn(calendarMemberColorTokens)
  public calendarColorToken!: CalendarMemberColorToken;
}

@Controller('household/members')
export class HouseholdMembersController {
  public constructor(private readonly members: HouseholdMembersService) {}

  @Get()
  public list(@CurrentUser() principal: SessionPrincipal) {
    return this.members.listForUser(principal.userId);
  }

  @Patch(':userId/calendar-color')
  public updateCalendarColor(
    @CurrentUser() principal: SessionPrincipal,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() input: UpdateCalendarColorDto,
  ) {
    return this.members.updateCalendarColor(
      principal.userId,
      userId,
      input.calendarColorToken,
    );
  }
}
