import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiException } from '../errors/api-exception.js';
import { AppConfigService } from '../../config/app-config.service.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const googleLoginPath = '/api/v1/auth/google';

@Injectable()
export class OriginGuard implements CanActivate {
  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (safeMethods.has(request.method)) return true;
    if (request.headers.origin !== this.config.webOrigin) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'SECURITY_INVALID_ORIGIN',
        'Původ požadavku není povolen.',
      );
    }
    if (request.path === googleLoginPath && !request.is('application/json')) {
      throw new ApiException(
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        'REQUEST_JSON_REQUIRED',
        'Požadavek musí používat formát JSON.',
      );
    }
    return true;
  }
}
