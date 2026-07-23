import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { FinanceModule } from '../finance/finance.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { FinanceCategorizationService } from './application/finance-categorization.service.js';
import { FinanceCategorizationFacade } from './finance-categorization.facade.js';
import { FinanceCategorizationController } from './presentation/finance-categorization.controller.js';

@Module({
  imports: [AuditModule, FinanceModule, HouseholdsModule],
  controllers: [FinanceCategorizationController],
  providers: [FinanceCategorizationService, FinanceCategorizationFacade],
  exports: [FinanceCategorizationFacade],
})
export class FinanceCategorizationModule {}
