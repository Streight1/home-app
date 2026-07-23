import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import {
  TEMPORARY_IMPORT_FILE_PORT,
  type TemporaryImportFilePort,
} from '../../domain/ports/temporary-import-file.port.js';
import { PrismaFinanceImportSessionRepository } from '../../infrastructure/prisma-finance-import-session.repository.js';

@Injectable()
export class CleanupExpiredImportsService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer: NodeJS.Timeout | undefined;

  public constructor(
    private readonly sessions: PrismaFinanceImportSessionRepository,
    @Inject(TEMPORARY_IMPORT_FILE_PORT)
    private readonly files: TemporaryImportFilePort,
  ) {}

  public onApplicationBootstrap(): void {
    this.timer = setInterval(() => {
      void this.execute(new Date());
    }, 15 * 60_000);
    this.timer.unref();
  }

  public onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  public async execute(now: Date): Promise<{ expiredCount: number }> {
    const expired = await this.sessions.expired(now);
    let expiredCount = 0;
    for (const session of expired) {
      try {
        if (session.temporaryStorageKey)
          await this.files.delete(session.temporaryStorageKey);
        await this.sessions.expire(session.id);
        expiredCount += 1;
      } catch {
        // The key remains in the database so a later bounded cleanup can retry.
      }
    }
    return { expiredCount };
  }
}
