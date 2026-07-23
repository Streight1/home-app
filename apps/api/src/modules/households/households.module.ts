import { Module } from '@nestjs/common';
import { HouseholdAccessService } from './household-access.service.js';
import { HouseholdProvisioningService } from './household-provisioning.service.js';
import { HouseholdsService } from './households.service.js';
import { HouseholdMembersController } from './household-members.controller.js';
import { HouseholdMembersService } from './household-members.service.js';

@Module({
  controllers: [HouseholdMembersController],
  providers: [
    HouseholdsService,
    HouseholdAccessService,
    HouseholdProvisioningService,
    HouseholdMembersService,
  ],
  exports: [
    HouseholdsService,
    HouseholdAccessService,
    HouseholdProvisioningService,
    HouseholdMembersService,
  ],
})
export class HouseholdsModule {}
