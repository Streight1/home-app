import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { FinanceCategorizationModule } from '../finance-categorization/finance-categorization.module.js';
import { FinanceModule } from '../finance/finance.module.js';
import { CleanupExpiredImportsService } from './application/cleanup/cleanup-expired-imports.service.js';
import { CalculateTransactionFingerprintService } from './application/deduplication/calculate-transaction-fingerprint.service.js';
import { NormalizeImportRowService } from './application/parsing/normalize-import-row.service.js';
import { DetectCsvFormatService } from './application/parsing/detect-csv-format.service.js';
import { ImportProfileService } from './application/profiles/import-profile.service.js';
import { CancelImportSessionService } from './application/sessions/cancel-import-session.service.js';
import { CommitImportSessionService } from './application/sessions/commit-import-session.service.js';
import { ConfigureImportSessionService } from './application/sessions/configure-import-session.service.js';
import { CreateImportSessionService } from './application/sessions/create-import-session.service.js';
import { GetImportSessionService } from './application/sessions/get-import-session.service.js';
import { PrepareImportRowsService } from './application/sessions/prepare-import-rows.service.js';
import { TEMPORARY_IMPORT_FILE_PORT } from './domain/ports/temporary-import-file.port.js';
import { PrismaFinanceImportProfileRepository } from './infrastructure/prisma-finance-import-profile.repository.js';
import { PrismaFinanceImportSessionRepository } from './infrastructure/prisma-finance-import-session.repository.js';
import { StorageTemporaryImportFileAdapter } from './infrastructure/storage-temporary-import-file.adapter.js';
import { FinanceImportProfilesController } from './presentation/finance-import-profiles.controller.js';
import { FinanceImportsController } from './presentation/finance-imports.controller.js';

@Module({
  imports: [AuditModule, FinanceModule, FinanceCategorizationModule],
  controllers: [FinanceImportsController, FinanceImportProfilesController],
  providers: [
    PrismaFinanceImportSessionRepository,
    PrismaFinanceImportProfileRepository,
    StorageTemporaryImportFileAdapter,
    {
      provide: TEMPORARY_IMPORT_FILE_PORT,
      useExisting: StorageTemporaryImportFileAdapter,
    },
    DetectCsvFormatService,
    CalculateTransactionFingerprintService,
    NormalizeImportRowService,
    CreateImportSessionService,
    ConfigureImportSessionService,
    PrepareImportRowsService,
    GetImportSessionService,
    CommitImportSessionService,
    CancelImportSessionService,
    ImportProfileService,
    CleanupExpiredImportsService,
  ],
})
export class FinanceImportsModule {}
