import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { FinanceCatalogService } from './application/finance-catalog.service.js';
import { FinanceLedgerService } from './application/finance-ledger.service.js';
import { FinanceReportingService } from './application/finance-reporting.service.js';
import { FinanceTransferService } from './application/finance-transfer.service.js';
import { FINANCE_CLOCK_PORT } from './domain/finance-clock.port.js';
import { PrismaFinancialAccountRepository } from './infrastructure/prisma-financial-account.repository.js';
import { PrismaFinancialCategoryRepository } from './infrastructure/prisma-financial-category.repository.js';
import { PrismaFinancialTransactionRepository } from './infrastructure/prisma-financial-transaction.repository.js';
import { PrismaFinancialTransferRepository } from './infrastructure/prisma-financial-transfer.repository.js';
import { SystemFinanceClockAdapter } from './infrastructure/system-finance-clock.adapter.js';
import { FinanceReportingController } from './presentation/finance-reporting.controller.js';
import { FinancialAccountsController } from './presentation/financial-accounts.controller.js';
import { FinancialCategoriesController } from './presentation/financial-categories.controller.js';
import { FinancialTransactionsController } from './presentation/financial-transactions.controller.js';
import { FinancialTransfersController } from './presentation/financial-transfers.controller.js';
import { FinanceLedgerFacade } from './finance-ledger.facade.js';

@Module({
  imports: [AuditModule, DocumentsModule, HouseholdsModule],
  controllers: [
    FinancialAccountsController,
    FinancialCategoriesController,
    FinancialTransactionsController,
    FinancialTransfersController,
    FinanceReportingController,
  ],
  providers: [
    PrismaFinancialAccountRepository,
    PrismaFinancialCategoryRepository,
    PrismaFinancialTransactionRepository,
    PrismaFinancialTransferRepository,
    SystemFinanceClockAdapter,
    { provide: FINANCE_CLOCK_PORT, useExisting: SystemFinanceClockAdapter },
    FinanceCatalogService,
    FinanceLedgerService,
    FinanceTransferService,
    FinanceReportingService,
    FinanceLedgerFacade,
  ],
  exports: [FinanceLedgerFacade],
})
export class FinanceModule {}
