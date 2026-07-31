import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { LocationModule } from '../location/location.module.js';
import { CreateTaskCategoryService } from './application/categories/create-task-category.service.js';
import { DeleteTaskCategoryService } from './application/categories/delete-task-category.service.js';
import { ListTaskCategoriesService } from './application/categories/list-task-categories.service.js';
import { UpdateTaskCategoryService } from './application/categories/update-task-category.service.js';
import { GetTaskAttentionService } from './application/dashboard/get-task-attention.service.js';
import { GetTaskDashboardService } from './application/dashboard/get-task-dashboard.service.js';
import { TaskDashboardResponseMapper } from './application/dashboard/task-dashboard-response.mapper.js';
import { MapTasksService } from './application/mappers/map-tasks.service.js';
import { TaskResponseMapper } from './application/mappers/task-response.mapper.js';
import { CalculateNextOccurrenceService } from './application/recurrence/calculate-next-occurrence.service.js';
import { ValidateRecurrenceService } from './application/recurrence/validate-recurrence.service.js';
import { ArchiveTaskService } from './application/tasks/archive-task.service.js';
import { CancelTaskService } from './application/tasks/cancel-task.service.js';
import { CompleteTaskService } from './application/tasks/complete-task.service.js';
import { CreateTaskService } from './application/tasks/create-task.service.js';
import { GetTaskDetailService } from './application/tasks/get-task-detail.service.js';
import { ListTasksService } from './application/tasks/list-tasks.service.js';
import { ReopenTaskService } from './application/tasks/reopen-task.service.js';
import { TaskWriteValidationService } from './application/tasks/task-write-validation.service.js';
import { ResolveTaskScheduleService } from './application/tasks/resolve-task-schedule.service.js';
import { UpdateTaskService } from './application/tasks/update-task.service.js';
import { TASK_REPOSITORY } from './domain/ports/task.repository.js';
import { CLOCK_PORT } from './domain/ports/clock.port.js';
import { TASK_CATEGORY_REPOSITORY } from './domain/ports/task-category.repository.js';
import { PrismaTaskRepository } from './infrastructure/prisma-task.repository.js';
import { PrismaTaskWriter } from './infrastructure/prisma-task.writer.js';
import { PrismaTaskCategoryRepository } from './infrastructure/prisma-task-category.repository.js';
import { SystemClockAdapter } from './infrastructure/system-clock.adapter.js';
import { TaskAttentionController } from './presentation/task-attention.controller.js';
import { TaskCategoriesController } from './presentation/task-categories.controller.js';
import { TasksController } from './presentation/tasks.controller.js';
import { TaskDashboardController } from './presentation/task-dashboard.controller.js';
import { TasksFacade } from './tasks.facade.js';
import { TasksSearchProvider } from './search/tasks-search.provider.js';

@Module({
  imports: [AuditModule, DocumentsModule, HouseholdsModule, LocationModule],
  controllers: [
    // Static routes must precede TasksController's /tasks/:taskId route.
    TaskDashboardController,
    TasksController,
    TaskCategoriesController,
    TaskAttentionController,
  ],
  providers: [
    PrismaTaskRepository,
    PrismaTaskWriter,
    {
      provide: TASK_REPOSITORY,
      useExisting: PrismaTaskRepository,
    },
    PrismaTaskCategoryRepository,
    {
      provide: TASK_CATEGORY_REPOSITORY,
      useExisting: PrismaTaskCategoryRepository,
    },
    SystemClockAdapter,
    { provide: CLOCK_PORT, useExisting: SystemClockAdapter },
    TaskResponseMapper,
    MapTasksService,
    ValidateRecurrenceService,
    CalculateNextOccurrenceService,
    TaskWriteValidationService,
    ResolveTaskScheduleService,
    CreateTaskService,
    ListTasksService,
    GetTaskDetailService,
    UpdateTaskService,
    CompleteTaskService,
    ReopenTaskService,
    CancelTaskService,
    ArchiveTaskService,
    ListTaskCategoriesService,
    CreateTaskCategoryService,
    UpdateTaskCategoryService,
    DeleteTaskCategoryService,
    GetTaskAttentionService,
    TaskDashboardResponseMapper,
    GetTaskDashboardService,
    TasksFacade,
    TasksSearchProvider,
  ],
  exports: [GetTaskAttentionService, TasksFacade, TasksSearchProvider],
})
export class TasksModule {}
