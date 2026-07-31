import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../infrastructure/storage/storage.port.js';
import {
  DOCUMENT_REPOSITORY,
  type DocumentRepository,
} from '../../domain/document.repository.js';

@Injectable()
export class StoredFileDeletionWorker
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(StoredFileDeletionWorker.name);
  private timer: NodeJS.Timeout | undefined;
  public constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: DocumentRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}
  public onApplicationBootstrap(): void {
    this.enqueue();
    this.timer = setInterval(() => this.enqueue(), 30_000);
    this.timer.unref();
  }
  public onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
  public enqueue(taskId?: string): void {
    setImmediate(() => {
      void this.processPending(taskId).catch(() => {
        this.logger.error({
          code: 'STORED_FILE_DELETE_WORKER_FAILED',
          ...(taskId ? { taskId } : {}),
        });
      });
    });
  }
  public async processPending(taskId?: string): Promise<void> {
    const tasks = await this.documents.claimDeletionTasks(20, taskId);
    for (const task of tasks) {
      try {
        await this.storage.delete(task.storageKey);
        const completed = await this.documents.completeDeletionTask(
          task.id,
          task.processingStartedAt,
        );
        if (!completed) {
          this.logger.warn({
            code: 'STORED_FILE_DELETE_LEASE_LOST',
            taskId: task.id,
          });
        }
      } catch {
        const failed = await this.documents.failDeletionTask(
          task.id,
          'STORAGE_DELETE_FAILED',
          task.processingStartedAt,
        );
        this.logger.warn({
          code: failed
            ? 'STORED_FILE_DELETE_RETRY'
            : 'STORED_FILE_DELETE_LEASE_LOST',
          taskId: task.id,
        });
      }
    }
  }
}
