import {
  HttpStatus,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import type { Server } from 'node:http';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter.js';
import { ApiException } from '../src/common/errors/api-exception.js';
import { ExpeditionsReportingService } from '../src/modules/expeditions/application/expeditions-reporting.service.js';
import { TripPackingService } from '../src/modules/expeditions/application/trip-packing.service.js';
import { TripsService } from '../src/modules/expeditions/application/trips.service.js';
import { TripsController } from '../src/modules/expeditions/presentation/trips.controller.js';
import { FinanceLedgerService } from '../src/modules/finance/application/finance-ledger.service.js';
import { FinancialTransactionsController } from '../src/modules/finance/presentation/financial-transactions.controller.js';
import { MealPlanningService } from '../src/modules/meals/application/meal-planning.service.js';
import { MealPlanController } from '../src/modules/meals/presentation/meal-plan.controller.js';

const userId = '10000000-0000-4000-8000-000000000001';
const accountId = '20000000-0000-4000-8000-000000000002';

describe('date-only HTTP validation', () => {
  let app: INestApplication;
  const planning = { create: vi.fn() };
  const trips = { create: vi.fn() };
  const ledger = { create: vi.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        MealPlanController,
        TripsController,
        FinancialTransactionsController,
      ],
      providers: [
        { provide: MealPlanningService, useValue: planning },
        { provide: TripsService, useValue: trips },
        { provide: TripPackingService, useValue: {} },
        { provide: ExpeditionsReportingService, useValue: {} },
        { provide: FinanceLedgerService, useValue: ledger },
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
        req.auth = { sessionId: 'session-id', userId };
        next();
      },
    );
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        exceptionFactory: () =>
          new ApiException(
            HttpStatus.BAD_REQUEST,
            'REQUEST_VALIDATION_FAILED',
            'Požadavek nemá platný formát.',
          ),
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it('rejects an impossible meal-plan date before planning is called', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/meal-plan')
      .send({
        plannedFor: '2026-02-30',
        mealType: 'LUNCH',
        title: 'Oběd',
        servings: '2',
        participantUserIds: [],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });
    expect(planning.create).not.toHaveBeenCalled();
  });

  it('rejects an impossible trip date before trips is called', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/trips')
      .send({
        title: 'Výprava',
        tripType: 'DAY_HIKE',
        startsOn: '2026-04-31',
        endsOn: '2026-05-01',
        overnightCount: 0,
        participants: [{ userId, role: 'ORGANIZER' }],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });
    expect(trips.create).not.toHaveBeenCalled();
  });

  it('rejects an impossible booked date before the ledger is called', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/finance/transactions/expense')
      .send({
        accountId,
        amountMinor: '10000',
        bookedDate: '2026-02-29',
        documentIds: [],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      code: 'REQUEST_VALIDATION_FAILED',
    });
    expect(ledger.create).not.toHaveBeenCalled();
  });
});
