import type { Request } from 'express';

export interface SessionPrincipal {
  sessionId: string;
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  auth: SessionPrincipal;
}
