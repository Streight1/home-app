import type { INestApplication } from '@nestjs/common';
import { Controller, Delete, Get, Post, RequestMethod } from '@nestjs/common';
import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessGuard } from '../src/common/access/access.guard.js';
import { PublicEndpoint } from '../src/common/access/public-endpoint.decorator.js';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter.js';
import { createCorsOptions } from '../src/common/http/cors-options.js';
import { CsrfGuard } from '../src/common/http/csrf.guard.js';
import { OriginGuard } from '../src/common/http/origin.guard.js';
import { AppConfigService } from '../src/config/app-config.service.js';
import { PrismaService } from '../src/infrastructure/database/prisma.service.js';
import { AuthController } from '../src/modules/auth/auth.controller.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { SessionCookieService } from '../src/modules/auth/session/session-cookie.service.js';
import { SessionService } from '../src/modules/auth/session/session.service.js';
import { HealthController } from '../src/modules/health/health.controller.js';
import { InternalHealthGuard } from '../src/modules/health/internal-health.guard.js';

@Controller('probe')
class DefaultProtectedController {
  @Get()
  public get(): { status: 'should-be-protected' } {
    return { status: 'should-be-protected' };
  }
}

@Controller('rogue-public')
class RoguePublicController {
  @PublicEndpoint()
  @Get()
  public get(): { status: 'must-not-open' } {
    return { status: 'must-not-open' };
  }
}

@Controller('documents')
class DocumentsPolicyController {
  @Post()
  public create(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller('tasks')
class TasksPolicyController {
  @Get()
  public list(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post()
  public create(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post(':taskId/scheduling/suggestions')
  public schedule(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller('calendar/events')
class CalendarPolicyController {
  @Get()
  public list(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post()
  public create(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Delete(':eventId')
  public delete(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller('locations')
class LocationPolicyController {
  @Get('suggest')
  public suggest(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('calendar-preferences')
  public preferences(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller('finance')
class FinancePolicyController {
  @Get('dashboard')
  public dashboard(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post('transactions/expense')
  public expense(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post('imports')
  public import(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('imports')
  public imports(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('import-profiles')
  public profiles(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('categorization-rules')
  public rules(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('analytics/summary')
  public analytics(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('analytics/dashboard')
  public analyticsDashboard(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('budgets')
  public budgets(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('insights')
  public insights(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('recurring-candidates')
  public recurringCandidates(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller('bucket-lists')
class BucketListPolicyController {
  @Get('dashboard')
  public dashboard(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get()
  public list(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post()
  public create(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller('maintenance')
class MaintenancePolicyController {
  @Get('dashboard')
  public dashboard(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('plans')
  public plans(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('tasks/:taskId')
  public taskContext(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post('plans')
  public create(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller()
class MealsPolicyController {
  @Get('recipes')
  public recipes(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post('recipes')
  public createRecipe(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('meal-plan')
  public mealPlan(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('shopping-lists')
  public shoppingLists(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('pantry')
  public pantry(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('meals/dashboard')
  public dashboard(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

@Controller()
class ExpeditionsPolicyController {
  @Get('gear')
  public gear(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Post('gear')
  public createGear(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('pack-templates')
  public templates(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('trips')
  public trips(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }

  @Get('trips/dashboard')
  public dashboard(): { status: 'must-be-protected' } {
    return { status: 'must-be-protected' };
  }
}

describe('deny-by-default HTTP access policy', () => {
  let app: INestApplication;
  const auth = {
    loginWithGoogle: vi.fn(),
    getProfile: vi.fn(),
    logout: vi.fn(),
  };
  const prisma = {
    session: { findUnique: vi.fn(), update: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue([{ value: 1 }]),
  };
  const config = {
    webOrigin: 'http://localhost:5173',
    sessionCookieName: 'life_admin_session',
    csrfCookieName: 'life_admin_csrf',
    sessionTtlDays: 30,
    internalHealthToken: '12345678901234567890123456789012',
    isProduction: false,
  };

  beforeEach(async () => {
    prisma.session.findUnique.mockResolvedValue(null);
    const module = await Test.createTestingModule({
      controllers: [
        AuthController,
        HealthController,
        DefaultProtectedController,
        RoguePublicController,
        DocumentsPolicyController,
        TasksPolicyController,
        CalendarPolicyController,
        LocationPolicyController,
        FinancePolicyController,
        BucketListPolicyController,
        MaintenancePolicyController,
        MealsPolicyController,
        ExpeditionsPolicyController,
      ],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: PrismaService, useValue: prisma },
        { provide: AppConfigService, useValue: config },
        SessionService,
        SessionCookieService,
        InternalHealthGuard,
        AccessGuard,
        OriginGuard,
        CsrfGuard,
      ],
    }).compile();
    app = module.createNestApplication();
    app.enableCors(createCorsOptions(config.webOrigin));
    app.setGlobalPrefix('api/v1', {
      exclude: [
        { path: 'internal/health/live', method: RequestMethod.GET },
        { path: 'internal/health/ready', method: RequestMethod.GET },
      ],
    });
    app.use(json());
    app.use(cookieParser());
    app.useGlobalGuards(
      app.get(AccessGuard),
      app.get(OriginGuard),
      app.get(CsrfGuard),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it('allows anonymous access only to the Google login endpoint', async () => {
    auth.loginWithGoogle.mockResolvedValue({
      user: {
        id: 'user-id',
        email: 'jana@example.com',
        displayName: 'Jana',
        avatarUrl: null,
      },
      activeHousehold: {
        id: 'household-id',
        name: 'Moje domácnost',
        role: 'OWNER',
      },
      sessionToken: 'raw-session-token',
      sessionExpiresAt: new Date(Date.now() + 60_000),
    });
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/google')
      .set('Origin', config.webOrigin)
      .set('Content-Type', 'application/json')
      .send({ credential: 'verified-google-token' })
      .expect(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies[0]).toContain('life_admin_session=raw-session-token');
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[1]).toContain('life_admin_csrf=');
    expect(cookies[1]).not.toContain('HttpOnly');
  });

  it.each(['/api/v1/auth/me', '/api/v1/probe'])(
    'returns 401 for anonymous GET %s',
    async (path) => {
      const response = await request(app.getHttpServer() as Server)
        .get(path)
        .expect(401);
      expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
    },
  );

  it('returns 401 for anonymous logout before CSRF evaluation', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/logout')
      .set('Origin', config.webOrigin)
      .expect(401);
    expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it('returns 401 for an anonymous document upload', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/documents')
      .set('Origin', config.webOrigin)
      .field('title', 'Soukromý dokument')
      .attach('file', Buffer.from('%PDF-1.7'), 'file.pdf')
      .expect(401);
    expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it.each([
    ['get', '/api/v1/tasks'],
    ['post', '/api/v1/tasks'],
    [
      'post',
      '/api/v1/tasks/30000000-0000-4000-8000-000000000001/scheduling/suggestions',
    ],
  ] as const)('returns 401 for anonymous tasks %s', async (method, path) => {
    const pending = request(app.getHttpServer() as Server)[method](path);
    if (method === 'post')
      pending.set('Origin', config.webOrigin).send({ title: 'Soukromý úkol' });
    const response = await pending.expect(401);
    expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it('allows browser preflight for DELETE and PUT mutations', async () => {
    const response = await request(app.getHttpServer() as Server)
      .options('/api/v1/calendar/events/40000000-0000-4000-8000-000000000001')
      .set('Origin', config.webOrigin)
      .set('Access-Control-Request-Method', 'DELETE')
      .set('Access-Control-Request-Headers', 'X-CSRF-Token')
      .expect(204);
    const allowedMethods = String(
      response.headers['access-control-allow-methods'],
    ).split(',');
    expect(allowedMethods).toContain('DELETE');
    expect(allowedMethods).toContain('PUT');
    expect(response.headers['access-control-allow-origin']).toBe(
      config.webOrigin,
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it.each([
    ['get', '/api/v1/calendar/events'],
    ['post', '/api/v1/calendar/events'],
    ['delete', '/api/v1/calendar/events/40000000-0000-4000-8000-000000000001'],
  ] as const)('returns 401 for anonymous calendar %s', async (method, path) => {
    const pending = request(app.getHttpServer() as Server)[method](path);
    if (method === 'post')
      pending
        .set('Origin', config.webOrigin)
        .send({ title: 'Soukromá událost' });
    const response = await pending.expect(401);
    expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it.each([
    '/api/v1/locations/suggest?query=Praha',
    '/api/v1/locations/calendar-preferences',
  ])('returns 401 for anonymous location GET %s', async (path) => {
    const response = await request(app.getHttpServer() as Server)
      .get(path)
      .expect(401);
    expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it.each([
    ['get', '/api/v1/finance/dashboard'],
    ['get', '/api/v1/finance/analytics/dashboard'],
    ['get', '/api/v1/finance/imports'],
    ['get', '/api/v1/finance/import-profiles'],
    ['get', '/api/v1/finance/categorization-rules'],
    ['get', '/api/v1/finance/budgets'],
    ['get', '/api/v1/finance/insights'],
    ['get', '/api/v1/finance/recurring-candidates'],
    ['post', '/api/v1/finance/imports'],
    ['post', '/api/v1/finance/transactions/expense'],
  ] as const)('returns 401 for anonymous finance %s', async (method, path) => {
    const pending = request(app.getHttpServer() as Server)[method](path);
    if (method === 'post') pending.set('Origin', config.webOrigin).send({});
    const response = await pending.expect(401);
    expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it.each([
    ['get', '/api/v1/bucket-lists'],
    ['get', '/api/v1/bucket-lists/dashboard'],
    ['post', '/api/v1/bucket-lists'],
  ] as const)(
    'returns 401 for anonymous bucket list %s',
    async (method, path) => {
      const pending = request(app.getHttpServer() as Server)[method](path);
      if (method === 'post')
        pending.set('Origin', config.webOrigin).send({ year: 2026 });
      const response = await pending.expect(401);
      expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
    },
  );

  it.each([
    ['get', '/api/v1/recipes'],
    ['post', '/api/v1/recipes'],
    ['get', '/api/v1/meal-plan'],
    ['get', '/api/v1/shopping-lists'],
    ['get', '/api/v1/pantry'],
    ['get', '/api/v1/meals/dashboard'],
  ] as const)('returns 401 for anonymous meals %s', async (method, path) => {
    const pending = request(app.getHttpServer() as Server)[method](path);
    if (method === 'post')
      pending.set('Origin', config.webOrigin).send({ title: 'Polévka' });
    const response = await pending.expect(401);
    expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
  });

  it.each([
    ['get', '/api/v1/gear'],
    ['post', '/api/v1/gear'],
    ['get', '/api/v1/pack-templates'],
    ['get', '/api/v1/trips'],
    ['get', '/api/v1/trips/dashboard'],
  ] as const)(
    'returns 401 for anonymous expeditions %s',
    async (method, path) => {
      const pending = request(app.getHttpServer() as Server)[method](path);
      if (method === 'post')
        pending.set('Origin', config.webOrigin).send({ name: 'Batoh' });
      const response = await pending.expect(401);
      expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
    },
  );

  it.each([
    ['get', '/api/v1/maintenance/plans'],
    ['get', '/api/v1/maintenance/dashboard'],
    ['get', '/api/v1/maintenance/tasks/40000000-0000-4000-8000-000000000001'],
    ['post', '/api/v1/maintenance/plans'],
  ] as const)(
    'returns 401 for anonymous maintenance %s',
    async (method, path) => {
      const pending = request(app.getHttpServer() as Server)[method](path);
      if (method === 'post')
        pending.set('Origin', config.webOrigin).send({ title: 'Revize' });
      const response = await pending.expect(401);
      expect(response.body).toMatchObject({ code: 'AUTH_INVALID_SESSION' });
    },
  );

  it('rejects an authenticated logout without a CSRF token', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: { status: 'ACTIVE' },
    });
    prisma.session.update.mockResolvedValue({});
    const response = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/logout')
      .set('Origin', config.webOrigin)
      .set('Cookie', 'life_admin_session=raw-token')
      .expect(403);
    expect(response.body).toMatchObject({ code: 'SECURITY_INVALID_CSRF' });
  });

  it.each([undefined, 'wrong-token'])(
    'returns 401 from internal health for token %s',
    async (token) => {
      const pending = request(app.getHttpServer() as Server).get(
        '/internal/health/live',
      );
      if (token) pending.set('X-Internal-Health-Token', token);
      const response = await pending.expect(401);
      expect(response.body).toMatchObject({ code: 'INTERNAL_UNAUTHORIZED' });
    },
  );

  it('allows internal health with the configured token', async () => {
    await request(app.getHttpServer() as Server)
      .get('/internal/health/live')
      .set('X-Internal-Health-Token', config.internalHealthToken)
      .expect(200, { status: 'ok' });
  });

  it('does not allow PublicEndpoint metadata outside the central allowlist', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/v1/rogue-public')
      .expect(401);
  });

  it('does not expose uploads as static files', async () => {
    await request(app.getHttpServer() as Server)
      .get('/uploads/private-document.pdf')
      .expect(404);
  });

  it('rejects Google login from an untrusted Origin', async () => {
    await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/google')
      .set('Origin', 'https://evil.test')
      .send({ credential: 'token' })
      .expect(403);
    expect(auth.loginWithGoogle).not.toHaveBeenCalled();
  });
});
