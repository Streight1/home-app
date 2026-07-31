import { Module } from '@nestjs/common';
import { BucketListModule } from '../bucket-list/bucket-list.module.js';
import { CalendarModule } from '../calendar/calendar.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { ExpeditionsModule } from '../expeditions/expeditions.module.js';
import { FinanceModule } from '../finance/finance.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { MaintenanceModule } from '../maintenance/maintenance.module.js';
import { MealsModule } from '../meals/meals.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { SearchRankingService } from './application/search-ranking.service.js';
import { SearchService } from './application/search.service.js';
import { SearchController } from './presentation/search.controller.js';

@Module({
  imports: [
    HouseholdsModule,
    DocumentsModule,
    TasksModule,
    MaintenanceModule,
    CalendarModule,
    FinanceModule,
    BucketListModule,
    MealsModule,
    ExpeditionsModule,
  ],
  controllers: [SearchController],
  providers: [SearchRankingService, SearchService],
})
export class SearchModule {}
