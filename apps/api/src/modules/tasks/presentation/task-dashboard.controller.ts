import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { GetTaskDashboardService } from '../application/dashboard/get-task-dashboard.service.js';
import { AttentionQueryDto } from './dto/attention-query.dto.js';

@Controller('tasks/dashboard')
export class TaskDashboardController {
  public constructor(private readonly dashboard: GetTaskDashboardService) {}

  @Get()
  public get(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: AttentionQueryDto,
  ) {
    return this.dashboard.execute(principal.userId, query.timezone);
  }
}
