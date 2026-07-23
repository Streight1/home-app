import { timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiException } from '../../common/errors/api-exception.js';
import { AppConfigService } from '../../config/app-config.service.js';

function timingSafeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

@Injectable()
export class InternalHealthGuard implements CanActivate {
  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const suppliedToken = request.header('X-Internal-Health-Token');
    if (
      !suppliedToken ||
      !timingSafeStringEqual(suppliedToken, this.config.internalHealthToken)
    ) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'INTERNAL_UNAUTHORIZED',
        'Přístup není povolen.',
      );
    }
    return true;
  }
}
