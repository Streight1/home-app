import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { ConfirmTaskSlotService } from '../application/confirm-task-slot.service.js';
import { SuggestTaskSlotsService } from '../application/suggest-task-slots.service.js';
import { UnscheduleTaskService } from '../application/unschedule-task.service.js';
import { ConfirmTaskSlotDto } from './dto/confirm-task-slot.dto.js';
import { SuggestTaskSlotsDto } from './dto/suggest-task-slots.dto.js';

@Controller('tasks/:taskId/scheduling')
export class TaskSchedulingController {
  public constructor(
    private readonly suggest: SuggestTaskSlotsService,
    private readonly confirm: ConfirmTaskSlotService,
    private readonly unschedule: UnscheduleTaskService,
  ) {}

  @Post('suggestions')
  public suggestions(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
    @Body() input: SuggestTaskSlotsDto,
  ) {
    return this.suggest.execute(principal.userId, taskId, input);
  }

  @Post('confirm')
  public confirmSlot(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
    @Body() input: ConfirmTaskSlotDto,
  ) {
    return this.confirm.execute(principal.userId, taskId, input.candidateToken);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
  ) {
    await this.unschedule.execute(principal.userId, taskId);
  }
}
