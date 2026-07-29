import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { MaintenanceDashboardService } from '../application/maintenance-dashboard.service.js';

@Controller('maintenance')
export class MaintenanceDashboardController {
  public constructor(private readonly dashboard: MaintenanceDashboardService) {}

  @Get('summary')
  public summary(@CurrentUser() principal: SessionPrincipal) {
    return this.dashboard.get(principal.userId);
  }

  @Get('dashboard')
  public dashboardModel(@CurrentUser() principal: SessionPrincipal) {
    return this.dashboard.get(principal.userId);
  }
}
