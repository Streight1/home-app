import 'reflect-metadata';
import {
  ConsoleLogger,
  HttpStatus,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import type { Express } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { ApiException } from './common/errors/api-exception.js';
import { ApiExceptionFilter } from './common/errors/api-exception.filter.js';
import { createCorsOptions } from './common/http/cors-options.js';
import { AppConfigService } from './config/app-config.service.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: new ConsoleLogger({ json: true, prefix: 'life-admin-api' }),
  });
  const config = app.get(AppConfigService);

  const expressApplication = app.getHttpAdapter().getInstance() as Express;
  expressApplication.set('trust proxy', config.trustProxy ? 1 : false);
  app.use(helmet());
  app.use(json({ limit: '32kb', type: 'application/json' }));
  app.use(cookieParser());
  app.enableCors(createCorsOptions(config.webOrigin));
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'internal/health/live', method: RequestMethod.GET },
      { path: 'internal/health/ready', method: RequestMethod.GET },
    ],
  });
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
  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');
}

await bootstrap();
