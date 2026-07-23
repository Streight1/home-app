import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedRequest,
  SessionPrincipal,
} from '../../modules/auth/session/authenticated-request.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionPrincipal => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  },
);
