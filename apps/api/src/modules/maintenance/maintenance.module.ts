import { Module } from '@nestjs/common';
import { APPLICATION_SEARCH_PROVIDER_TOKENS } from '../../common/search/application-search-provider.js';
import { AuditModule } from '../audit/audit.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { FinanceModule } from '../finance/finance.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { MaintenanceCategoriesService } from './application/maintenance-categories.service.js';
import { MaintenanceCompletionService } from './application/maintenance-completion.service.js';
import { MaintenanceDashboardService } from './application/maintenance-dashboard.service.js';
import { MaintenanceGenerationWorker } from './application/maintenance-generation.worker.js';
import { MaintenanceOccurrencesService } from './application/maintenance-occurrences.service.js';
import { MaintenancePlansService } from './application/maintenance-plans.service.js';
import { MaintenanceProgressionService } from './application/maintenance-progression.service.js';
import { MaintenanceRecurrenceService } from './application/maintenance-recurrence.service.js';
import { MaintenanceResponseMapper } from './application/maintenance-response.mapper.js';
import { MaintenanceTaskService } from './application/maintenance-task.service.js';
import { MaintenanceValidationService } from './application/maintenance-validation.service.js';
import { MAINTENANCE_CLOCK } from './domain/maintenance-clock.port.js';
import { PrismaMaintenanceCategoryRepository } from './infrastructure/prisma-maintenance-category.repository.js';
import { PrismaMaintenanceDashboardRepository } from './infrastructure/prisma-maintenance-dashboard.repository.js';
import { PrismaMaintenanceLinkRepository } from './infrastructure/prisma-maintenance-link.repository.js';
import { PrismaMaintenanceOccurrenceRepository } from './infrastructure/prisma-maintenance-occurrence.repository.js';
import { PrismaMaintenancePlanRepository } from './infrastructure/prisma-maintenance-plan.repository.js';
import { PrismaMaintenancePlanWriter } from './infrastructure/prisma-maintenance-plan.writer.js';
import { SystemMaintenanceClockAdapter } from './infrastructure/system-maintenance-clock.adapter.js';
import { MaintenanceFacade } from './maintenance.facade.js';
import { MaintenanceCategoriesController } from './presentation/maintenance-categories.controller.js';
import { MaintenanceDashboardController } from './presentation/maintenance-dashboard.controller.js';
import { MaintenanceHistoryController } from './presentation/maintenance-history.controller.js';
import { MaintenanceOccurrencesController } from './presentation/maintenance-occurrences.controller.js';
import { MaintenancePlansController } from './presentation/maintenance-plans.controller.js';
import { MaintenanceTaskContextController } from './presentation/maintenance-task-context.controller.js';
import { MaintenanceSearchProvider } from './search/maintenance-search.provider.js';

@Module({
  imports: [
    AuditModule,
    DocumentsModule,
    FinanceModule,
    HouseholdsModule,
    TasksModule,
  ],
  controllers: [
    MaintenanceDashboardController,
    MaintenancePlansController,
    MaintenanceOccurrencesController,
    MaintenanceHistoryController,
    MaintenanceCategoriesController,
    MaintenanceTaskContextController,
  ],
  providers: [
    PrismaMaintenanceCategoryRepository,
    PrismaMaintenanceDashboardRepository,
    PrismaMaintenanceLinkRepository,
    PrismaMaintenanceOccurrenceRepository,
    PrismaMaintenancePlanRepository,
    PrismaMaintenancePlanWriter,
    SystemMaintenanceClockAdapter,
    {
      provide: MAINTENANCE_CLOCK,
      useExisting: SystemMaintenanceClockAdapter,
    },
    MaintenanceRecurrenceService,
    MaintenanceValidationService,
    MaintenanceResponseMapper,
    MaintenanceTaskService,
    MaintenancePlansService,
    MaintenanceProgressionService,
    MaintenanceOccurrencesService,
    MaintenanceCompletionService,
    MaintenanceGenerationWorker,
    MaintenanceCategoriesService,
    MaintenanceDashboardService,
    MaintenanceFacade,
    MaintenanceSearchProvider,
    {
      provide: APPLICATION_SEARCH_PROVIDER_TOKENS.maintenance,
      useExisting: MaintenanceSearchProvider,
    },
  ],
  exports: [MaintenanceFacade, APPLICATION_SEARCH_PROVIDER_TOKENS.maintenance],
})
export class MaintenanceModule {}
