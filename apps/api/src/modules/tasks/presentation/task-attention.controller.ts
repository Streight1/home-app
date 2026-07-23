import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { GetTaskAttentionService } from '../application/dashboard/get-task-attention.service.js';
import { AttentionQueryDto } from './dto/attention-query.dto.js';

@Controller('tasks/attention')
export class TaskAttentionController {
  public constructor(private readonly attention: GetTaskAttentionService) {}

  @Get()
  public get(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: AttentionQueryDto,
  ) {
    return this.attention.execute(principal.userId, query.timezone);
  }
}
