import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { ApiException } from '../../../common/errors/api-exception.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import type { VerifiedGoogleIdentity } from '../auth.types.js';
import type { GoogleTokenVerifierPort } from './google-token-verifier.port.js';

@Injectable()
export class GoogleTokenVerifierService implements GoogleTokenVerifierPort {
  private readonly client = new OAuth2Client();

  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public async verify(credential: string): Promise<VerifiedGoogleIdentity> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken: credential,
        audience: this.config.googleClientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email || payload.email_verified !== true) {
        throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          'AUTH_INVALID_GOOGLE_IDENTITY',
          'Google účet neposkytl ověřenou identitu.',
        );
      }
      return {
        subject: payload.sub,
        email: payload.email.trim().toLowerCase(),
        emailVerified: true,
        displayName: payload.name?.trim() ?? null,
        avatarUrl: payload.picture ?? null,
      };
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        'AUTH_INVALID_GOOGLE_TOKEN',
        'Přihlášení přes Google se nepodařilo ověřit.',
      );
    }
  }
}
