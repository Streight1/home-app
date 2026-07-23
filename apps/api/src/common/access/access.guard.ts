import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiException } from '../errors/api-exception.js';
import { InternalHealthGuard } from '../../modules/health/internal-health.guard.js';
import { SessionService } from '../../modules/auth/session/session.service.js';
import { ACCESS_MODE_KEY, AccessMode } from './access-mode.decorator.js';

@Injectable()
export class AccessGuard implements CanActivate {
  public constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(InternalHealthGuard)
    private readonly internalHealth: InternalHealthGuard,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const mode =
      this.reflector.getAllAndOverride<AccessMode | undefined>(
        ACCESS_MODE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? AccessMode.AUTHENTICATED;
    if (mode === AccessMode.INTERNAL)
      return this.internalHealth.canActivate(context);
    const request = context.switchToHttp().getRequest<Request>();
    if (mode === AccessMode.PUBLIC) {
      if (request.method === 'POST' && request.path === '/api/v1/auth/google')
        return true;
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_INVALID_SESSION',
        'Přihlášení již není platné.',
      );
    }
    await this.sessions.authenticateRequest(request);
    return true;
  }
}
