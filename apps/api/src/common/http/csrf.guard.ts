import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service.js';
import { ApiException } from '../errors/api-exception.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const googleLoginPath = '/api/v1/auth/google';

function tokensEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

@Injectable()
export class CsrfGuard implements CanActivate {
  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (safeMethods.has(request.method) || request.path === googleLoginPath)
      return true;
    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    const cookieToken = cookies?.[this.config.csrfCookieName];
    const headerToken = request.header('X-CSRF-Token');
    if (
      !cookieToken ||
      !headerToken ||
      !tokensEqual(cookieToken, headerToken)
    ) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'SECURITY_INVALID_CSRF',
        'Bezpečnostní token požadavku není platný.',
      );
    }
    return true;
  }
}
