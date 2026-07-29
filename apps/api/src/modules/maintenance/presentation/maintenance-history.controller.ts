import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { MaintenanceOccurrencesService } from '../application/maintenance-occurrences.service.js';
import { ListMaintenanceOccurrencesQueryDto } from './dto/maintenance.dto.js';

@Controller('maintenance/history')
export class MaintenanceHistoryController {
  public constructor(
    private readonly occurrences: MaintenanceOccurrencesService,
  ) {}

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListMaintenanceOccurrencesQueryDto,
  ) {
    return this.occurrences.list(principal.userId, query);
  }
}
