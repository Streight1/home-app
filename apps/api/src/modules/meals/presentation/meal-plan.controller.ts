import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { MealPlanningService } from '../application/meal-planning.service.js';
import {
  CopyMealPlanWeekDto,
  CreateMealPlanEntryDto,
  MealPlanRangeQueryDto,
  UpdateMealPlanEntryDto,
} from './dto/planning.dto.js';

@Controller('meal-plan')
export class MealPlanController {
  public constructor(private readonly planning: MealPlanningService) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: MealPlanRangeQueryDto,
  ) {
    return this.planning.list(principal.userId, query);
  }

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateMealPlanEntryDto,
  ) {
    return this.planning.create(principal.userId, input);
  }

  @Patch(':entryId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('entryId', new ParseUUIDPipe({ version: '4' })) entryId: string,
    @Body() input: UpdateMealPlanEntryDto,
  ) {
    return this.planning.update(principal.userId, entryId, input);
  }

  @Delete(':entryId')
  public remove(
    @CurrentUser() principal: SessionPrincipal,
    @Param('entryId', new ParseUUIDPipe({ version: '4' })) entryId: string,
  ) {
    return this.planning.remove(principal.userId, entryId);
  }

  @Post('copy-week')
  public copyWeek(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CopyMealPlanWeekDto,
  ) {
    return this.planning.copyWeek(principal.userId, input);
  }
}
