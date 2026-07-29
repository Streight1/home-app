import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { MaintenanceFacade } from '../maintenance.facade.js';

@Controller('maintenance/tasks')
export class MaintenanceTaskContextController {
  public constructor(private readonly maintenance: MaintenanceFacade) {}

  @Get(':taskId')
  public get(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
  ) {
    return this.maintenance.getTaskContext(principal.userId, taskId);
  }
}
