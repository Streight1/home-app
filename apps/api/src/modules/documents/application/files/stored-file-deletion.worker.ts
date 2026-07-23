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
    setImmediate(() => void this.processPending(taskId));
  }
  public async processPending(taskId?: string): Promise<void> {
    const tasks = await this.documents.findDeletionTasks(20, taskId);
    for (const task of tasks) {
      try {
        await this.documents.markDeletionTaskProcessing(task.id);
        await this.storage.delete(task.storageKey);
        await this.documents.completeDeletionTask(task.id);
      } catch {
        await this.documents.failDeletionTask(task.id, 'STORAGE_DELETE_FAILED');
        this.logger.warn({ code: 'STORED_FILE_DELETE_RETRY', taskId: task.id });
      }
    }
  }
}
