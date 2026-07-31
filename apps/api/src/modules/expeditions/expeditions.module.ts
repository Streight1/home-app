import { Module } from '@nestjs/common';
import { APPLICATION_SEARCH_PROVIDER_TOKENS } from '../../common/search/application-search-provider.js';
import { AuditModule } from '../audit/audit.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { TasksModule } from '../tasks/tasks.module.js';
import { ExpeditionsReportingService } from './application/expeditions-reporting.service.js';
import { GearCategoriesService } from './application/gear-categories.service.js';
import { GearImagesService } from './application/gear-images.service.js';
import { GearService } from './application/gear.service.js';
import { PackTemplatesService } from './application/pack-templates.service.js';
import { TripPackingService } from './application/trip-packing.service.js';
import { TripsService } from './application/trips.service.js';
import { ExpeditionWeightService } from './domain/expedition-weight.service.js';
import { TripReadinessService } from './domain/trip-readiness.service.js';
import { ExpeditionsSearchProvider } from './expeditions-search.provider.js';
import { ExpeditionsFacade } from './expeditions.facade.js';
import { DisabledGearImageSearchAdapter } from './images/disabled-gear-image-search.adapter.js';
import { GEAR_IMAGE_HTTP_PORT } from './images/gear-image-http.port.js';
import { GEAR_IMAGE_SEARCH_PORT } from './images/gear-image-search.port.js';
import { NodeGearImageHttpAdapter } from './images/node-gear-image-http.adapter.js';
import { GearCategoriesController } from './presentation/gear-categories.controller.js';
import { GearController } from './presentation/gear.controller.js';
import { PackTemplatesController } from './presentation/pack-templates.controller.js';
import { TripsController } from './presentation/trips.controller.js';

@Module({
  imports: [AuditModule, DocumentsModule, HouseholdsModule, TasksModule],
  controllers: [
    GearController,
    GearCategoriesController,
    PackTemplatesController,
    TripsController,
  ],
  providers: [
    GearService,
    GearCategoriesService,
    PackTemplatesService,
    TripsService,
    TripPackingService,
    ExpeditionsReportingService,
    GearImagesService,
    ExpeditionWeightService,
    TripReadinessService,
    NodeGearImageHttpAdapter,
    {
      provide: GEAR_IMAGE_HTTP_PORT,
      useExisting: NodeGearImageHttpAdapter,
    },
    DisabledGearImageSearchAdapter,
    {
      provide: GEAR_IMAGE_SEARCH_PORT,
      useExisting: DisabledGearImageSearchAdapter,
    },
    ExpeditionsSearchProvider,
    {
      provide: APPLICATION_SEARCH_PROVIDER_TOKENS.expeditions,
      useExisting: ExpeditionsSearchProvider,
    },
    ExpeditionsFacade,
  ],
  exports: [ExpeditionsFacade, APPLICATION_SEARCH_PROVIDER_TOKENS.expeditions],
})
export class ExpeditionsModule {}
