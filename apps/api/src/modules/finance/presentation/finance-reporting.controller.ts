import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { FinanceReportingService } from '../application/finance-reporting.service.js';
import { FinancePeriodDto } from './dto/list-financial-transactions.dto.js';

@Controller('finance')
export class FinanceReportingController {
  public constructor(private readonly reporting: FinanceReportingService) {}

  @Get('summary')
  public summary(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: FinancePeriodDto,
  ) {
    return this.reporting.summary(principal.userId, query);
  }

  @Get('dashboard')
  public dashboard(@CurrentUser() principal: SessionPrincipal) {
    return this.reporting.dashboard(principal.userId);
  }
}
