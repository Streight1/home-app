import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PrismaMaintenancePlanRepository } from '../infrastructure/prisma-maintenance-plan.repository.js';
import { MaintenancePlansService } from './maintenance-plans.service.js';

const GENERATION_INTERVAL_MS = 6 * 60 * 60_000;

@Injectable()
export class MaintenanceGenerationWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(MaintenanceGenerationWorker.name);
  private timer: NodeJS.Timeout | undefined;

  public constructor(
    private readonly plans: PrismaMaintenancePlanRepository,
    private readonly planService: MaintenancePlansService,
  ) {}

  public onApplicationBootstrap(): void {
    this.enqueue();
    this.timer = setInterval(() => this.enqueue(), GENERATION_INTERVAL_MS);
    this.timer.unref();
  }

  public onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  public enqueue(): void {
    setImmediate(() => {
      void this.execute().catch(() => {
        this.logger.warn({ code: 'MAINTENANCE_GENERATION_RETRY' });
      });
    });
  }

  public async execute(): Promise<{ processedCount: number }> {
    const candidates = await this.plans.generationCandidates();
    let processedCount = 0;
    for (const candidate of candidates) {
      const actorUserId = candidate.household.members[0]?.userId;
      if (!actorUserId) continue;
      try {
        await this.planService.generateForPlan(actorUserId, candidate.id);
        processedCount += 1;
      } catch {
        this.logger.warn({
          code: 'MAINTENANCE_GENERATION_RETRY',
          planId: candidate.id,
        });
      }
    }
    return { processedCount };
  }
}
