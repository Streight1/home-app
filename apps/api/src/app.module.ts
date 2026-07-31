import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AccessGuard } from './common/access/access.guard.js';
import { CsrfGuard } from './common/http/csrf.guard.js';
import { OriginGuard } from './common/http/origin.guard.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infrastructure/database/prisma.module.js';
import { StorageModule } from './infrastructure/storage/storage.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { SchedulingModule } from './modules/scheduling/scheduling.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { DocumentExtractionModule } from './modules/document-extraction/document-extraction.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { HouseholdsModule } from './modules/households/households.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CalendarModule } from './modules/calendar/calendar.module.js';
import { LocationModule } from './modules/location/location.module.js';
import { FinanceModule } from './modules/finance/finance.module.js';
import { FinanceCategorizationModule } from './modules/finance-categorization/finance-categorization.module.js';
import { FinanceImportsModule } from './modules/finance-imports/finance-imports.module.js';
import { FinanceAnalyticsModule } from './modules/finance-analytics/finance-analytics.module.js';
import { FinanceBudgetsModule } from './modules/finance-budgets/finance-budgets.module.js';
import { BucketListModule } from './modules/bucket-list/bucket-list.module.js';
import { MaintenanceModule } from './modules/maintenance/maintenance.module.js';
import { MealsModule } from './modules/meals/meals.module.js';
import { ExpeditionsModule } from './modules/expeditions/expeditions.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    AuthModule,
    DocumentsModule,
    DocumentExtractionModule,
    UsersModule,
    HouseholdsModule,
    AuditModule,
    TasksModule,
    SchedulingModule,
    LocationModule,
    CalendarModule,
    FinanceModule,
    FinanceCategorizationModule,
    FinanceImportsModule,
    FinanceAnalyticsModule,
    FinanceBudgetsModule,
    BucketListModule,
    MaintenanceModule,
    MealsModule,
    ExpeditionsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
