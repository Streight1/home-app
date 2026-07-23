import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { AppConfigService } from '../../../config/app-config.service.js';

@Injectable()
export class SessionCookieService {
  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public setSession(
    response: Response,
    rawToken: string,
    expiresAt: Date,
  ): void {
    const maxAge = expiresAt.getTime() - Date.now();
    response.cookie(this.config.sessionCookieName, rawToken, {
      ...this.baseCookieOptions(),
      httpOnly: true,
      maxAge,
    });
    response.cookie(
      this.config.csrfCookieName,
      randomBytes(32).toString('base64url'),
      {
        ...this.baseCookieOptions(),
        httpOnly: false,
        maxAge,
      },
    );
  }

  public clearSession(response: Response): void {
    response.clearCookie(this.config.sessionCookieName, {
      ...this.baseCookieOptions(),
      httpOnly: true,
    });
    response.clearCookie(this.config.csrfCookieName, {
      ...this.baseCookieOptions(),
      httpOnly: false,
    });
  }

  private baseCookieOptions(): CookieOptions {
    return { sameSite: 'lax', secure: this.config.isProduction, path: '/' };
  }
}
