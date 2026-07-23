import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { InternalHealthGuard } from './internal-health.guard.js';

@Module({
  controllers: [HealthController],
  providers: [InternalHealthGuard],
  exports: [InternalHealthGuard],
})
export class HealthModule {}
