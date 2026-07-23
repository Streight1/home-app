import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiException } from '../../common/errors/api-exception.js';
import { AppConfigService } from '../../config/app-config.service.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { HouseholdProvisioningService } from '../households/household-provisioning.service.js';
import { HouseholdsService } from '../households/households.service.js';
import type {
  AuthProfile,
  LoginResult,
  VerifiedGoogleIdentity,
} from './auth.types.js';
import {
  GOOGLE_TOKEN_VERIFIER,
  type GoogleTokenVerifierPort,
} from './google/google-token-verifier.port.js';
import { SessionService } from './session/session.service.js';

function isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  public constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AppConfigService) private readonly config: AppConfigService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(HouseholdProvisioningService)
    private readonly provisioning: HouseholdProvisioningService,
    @Inject(HouseholdsService) private readonly households: HouseholdsService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(GOOGLE_TOKEN_VERIFIER)
    private readonly googleVerifier: GoogleTokenVerifierPort,
  ) {}

  public async loginWithGoogle(
    credential: string,
    userAgent: string | undefined,
  ): Promise<LoginResult> {
    const identity = await this.googleVerifier.verify(credential);
    this.assertEmailAllowed(identity.email);
    try {
      return await this.persistLogin(identity, userAgent);
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      return this.persistLogin(identity, userAgent);
    }
  }

  public getProfile(userId: string): Promise<AuthProfile> {
    return this.households.getAuthProfile(userId);
  }

  public async logout(sessionId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await this.sessions.revoke(transaction, sessionId, userId);
      const membership = await this.households.findFirstMembership(
        transaction,
        userId,
      );
      await this.audit.record(transaction, {
        action: 'AUTH_LOGOUT_SUCCEEDED',
        userId,
        ...(membership ? { householdId: membership.householdId } : {}),
        entityType: 'Session',
        entityId: sessionId,
      });
    });
  }

  private async persistLogin(
    identity: VerifiedGoogleIdentity,
    userAgent: string | undefined,
  ): Promise<LoginResult> {
    return this.prisma.$transaction(async (transaction) => {
      const { user, membership } = await this.provisioning.provision(
        transaction,
        identity,
      );
      const session = await this.sessions.create(
        transaction,
        user.id,
        userAgent,
      );
      await this.audit.record(transaction, {
        action: 'AUTH_LOGIN_SUCCEEDED',
        userId: user.id,
        householdId: membership.householdId,
        entityType: 'Session',
        entityId: session.sessionId,
      });
      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        activeHousehold: {
          id: membership.household.id,
          name: membership.household.name,
          role: membership.role,
        },
        sessionToken: session.rawToken,
        sessionExpiresAt: session.expiresAt,
      };
    });
  }

  private assertEmailAllowed(email: string): void {
    const allowedEmails = this.config.googleAllowedEmails;
    if (
      allowedEmails.length > 0 &&
      !allowedEmails.includes(email.trim().toLowerCase())
    ) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'AUTH_EMAIL_NOT_ALLOWED',
        'Tento Google účet nemá přístup.',
      );
    }
  }
}
