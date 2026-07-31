import { Module } from '@nestjs/common';
import {
  APPLICATION_SEARCH_PROVIDER_ORDER,
  APPLICATION_SEARCH_PROVIDER_TOKENS,
  APPLICATION_SEARCH_PROVIDERS_TOKEN,
  type ApplicationSearchProvider,
} from '../../common/search/application-search-provider.js';
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
  providers: [
    SearchRankingService,
    {
      provide: APPLICATION_SEARCH_PROVIDERS_TOKEN,
      inject: APPLICATION_SEARCH_PROVIDER_ORDER.map(
        (providerKey) => APPLICATION_SEARCH_PROVIDER_TOKENS[providerKey],
      ),
      useFactory: (...providers: ApplicationSearchProvider[]) => providers,
    },
    SearchService,
  ],
})
export class SearchModule {}
