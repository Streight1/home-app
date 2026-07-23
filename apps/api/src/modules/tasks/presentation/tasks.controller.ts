import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/access/current-user.decorator.js';
import type { SessionPrincipal } from '../../auth/session/authenticated-request.js';
import { ArchiveTaskService } from '../application/tasks/archive-task.service.js';
import { CancelTaskService } from '../application/tasks/cancel-task.service.js';
import { CompleteTaskService } from '../application/tasks/complete-task.service.js';
import { CreateTaskService } from '../application/tasks/create-task.service.js';
import { GetTaskDetailService } from '../application/tasks/get-task-detail.service.js';
import { ListTasksService } from '../application/tasks/list-tasks.service.js';
import { ReopenTaskService } from '../application/tasks/reopen-task.service.js';
import { UpdateTaskService } from '../application/tasks/update-task.service.js';
import { CompleteTaskDto } from './dto/complete-task.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Controller('tasks')
export class TasksController {
  public constructor(
    private readonly createTask: CreateTaskService,
    private readonly listTasks: ListTasksService,
    private readonly getTask: GetTaskDetailService,
    private readonly updateTask: UpdateTaskService,
    private readonly completeTask: CompleteTaskService,
    private readonly reopenTask: ReopenTaskService,
    private readonly cancelTask: CancelTaskService,
    private readonly archiveTask: ArchiveTaskService,
  ) {}

  @Post()
  public create(
    @CurrentUser() principal: SessionPrincipal,
    @Body() input: CreateTaskDto,
  ) {
    return this.createTask.execute(principal.userId, input);
  }

  @Get()
  public list(
    @CurrentUser() principal: SessionPrincipal,
    @Query() query: ListTasksQueryDto,
  ) {
    return this.listTasks.execute(principal.userId, query);
  }

  @Get(':taskId')
  public detail(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
  ) {
    return this.getTask.execute(principal.userId, taskId);
  }

  @Patch(':taskId')
  public update(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
    @Body() input: UpdateTaskDto,
  ) {
    return this.updateTask.execute(principal.userId, taskId, input);
  }

  @Post(':taskId/complete')
  public complete(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
    @Body() input: CompleteTaskDto,
  ) {
    return this.completeTask.execute(principal.userId, taskId, input);
  }

  @Post(':taskId/reopen')
  public reopen(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
  ) {
    return this.reopenTask.execute(principal.userId, taskId);
  }

  @Post(':taskId/cancel')
  public cancel(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
  ) {
    return this.cancelTask.execute(principal.userId, taskId);
  }

  @Post(':taskId/archive')
  public archive(
    @CurrentUser() principal: SessionPrincipal,
    @Param('taskId', new ParseUUIDPipe({ version: '4' })) taskId: string,
  ) {
    return this.archiveTask.execute(principal.userId, taskId);
  }
}
