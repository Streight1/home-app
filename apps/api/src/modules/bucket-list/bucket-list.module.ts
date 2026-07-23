import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { DocumentsModule } from '../documents/documents.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { LocationModule } from '../location/location.module.js';
import { BucketListDashboardService } from './application/bucket-list-dashboard.service.js';
import { BucketListInputValidationService } from './application/bucket-list-input-validation.service.js';
import { BucketListItemService } from './application/bucket-list-item.service.js';
import { BucketListLifecycleService } from './application/bucket-list-lifecycle.service.js';
import { BucketListResponseMapper } from './application/bucket-list-response.mapper.js';
import { BucketListRolloverService } from './application/bucket-list-rollover.service.js';
import { BucketListService } from './application/bucket-list.service.js';
import { BUCKET_LIST_CLOCK } from './domain/bucket-list-clock.port.js';
import { PrismaBucketListItemRepository } from './infrastructure/prisma-bucket-list-item.repository.js';
import { PrismaBucketListLifecycleRepository } from './infrastructure/prisma-bucket-list-lifecycle.repository.js';
import { PrismaBucketListRepository } from './infrastructure/prisma-bucket-list.repository.js';
import { PrismaBucketListRolloverRepository } from './infrastructure/prisma-bucket-list-rollover.repository.js';
import { SystemBucketListClockAdapter } from './infrastructure/system-bucket-list-clock.adapter.js';
import { BucketListItemsController } from './presentation/bucket-list-items.controller.js';
import { BucketListsController } from './presentation/bucket-lists.controller.js';

@Module({
  imports: [AuditModule, DocumentsModule, HouseholdsModule, LocationModule],
  controllers: [BucketListsController, BucketListItemsController],
  providers: [
    PrismaBucketListRepository,
    PrismaBucketListItemRepository,
    PrismaBucketListLifecycleRepository,
    PrismaBucketListRolloverRepository,
    BucketListResponseMapper,
    BucketListInputValidationService,
    BucketListService,
    BucketListItemService,
    BucketListLifecycleService,
    BucketListRolloverService,
    BucketListDashboardService,
    SystemBucketListClockAdapter,
    {
      provide: BUCKET_LIST_CLOCK,
      useExisting: SystemBucketListClockAdapter,
    },
  ],
})
export class BucketListModule {}
