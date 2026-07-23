import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter.js';
import { ArchiveTaskService } from '../src/modules/tasks/application/tasks/archive-task.service.js';
import { CancelTaskService } from '../src/modules/tasks/application/tasks/cancel-task.service.js';
import { CompleteTaskService } from '../src/modules/tasks/application/tasks/complete-task.service.js';
import { CreateTaskService } from '../src/modules/tasks/application/tasks/create-task.service.js';
import { GetTaskDashboardService } from '../src/modules/tasks/application/dashboard/get-task-dashboard.service.js';
import { GetTaskDetailService } from '../src/modules/tasks/application/tasks/get-task-detail.service.js';
import { ListTasksService } from '../src/modules/tasks/application/tasks/list-tasks.service.js';
import { ReopenTaskService } from '../src/modules/tasks/application/tasks/reopen-task.service.js';
import { UpdateTaskService } from '../src/modules/tasks/application/tasks/update-task.service.js';
import { TaskDashboardController } from '../src/modules/tasks/presentation/task-dashboard.controller.js';
import { TasksController } from '../src/modules/tasks/presentation/tasks.controller.js';

const dashboardResponse = {
  summary: {
    openTotal: 0,
    overdueTotal: 0,
    dueTodayTotal: 0,
    upcomingTotal: 0,
  },
  items: [],
};

describe('tasks dashboard HTTP contract', () => {
  let app: INestApplication;
  const dashboard = { execute: vi.fn().mockResolvedValue(dashboardResponse) };
  const detail = { execute: vi.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TaskDashboardController, TasksController],
      providers: [
        { provide: GetTaskDashboardService, useValue: dashboard },
        { provide: GetTaskDetailService, useValue: detail },
        ...[
          CreateTaskService,
          ListTasksService,
          UpdateTaskService,
          CompleteTaskService,
          ReopenTaskService,
          CancelTaskService,
          ArchiveTaskService,
        ].map((provide) => ({ provide, useValue: { execute: vi.fn() } })),
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(
      (
        req: Request & { auth?: { sessionId: string; userId: string } },
        _res: Response,
        next: NextFunction,
      ) => {
        req.auth = { sessionId: 'session-id', userId: 'user-id' };
        next();
      },
    );
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it('routes the static dashboard endpoint before the UUID detail route', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/api/v1/tasks/dashboard?timezone=Europe%2FPrague')
      .expect(200);
    expect(response.body).toEqual(dashboardResponse);
    expect(dashboard.execute).toHaveBeenCalledWith('user-id', 'Europe/Prague');
    expect(detail.execute).not.toHaveBeenCalled();
  });

  it('accepts an omitted optional timezone using the DTO default', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/v1/tasks/dashboard')
      .expect(200);
    expect(dashboard.execute).toHaveBeenCalledWith('user-id', 'Europe/Prague');
  });
});
