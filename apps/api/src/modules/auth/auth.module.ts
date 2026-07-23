import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { HouseholdsModule } from '../households/households.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GOOGLE_TOKEN_VERIFIER } from './google/google-token-verifier.port.js';
import { GoogleTokenVerifierService } from './google/google-token-verifier.service.js';
import { SessionCookieService } from './session/session-cookie.service.js';
import { SessionService } from './session/session.service.js';

@Module({
  imports: [AuditModule, UsersModule, HouseholdsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    SessionCookieService,
    GoogleTokenVerifierService,
    { provide: GOOGLE_TOKEN_VERIFIER, useExisting: GoogleTokenVerifierService },
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
