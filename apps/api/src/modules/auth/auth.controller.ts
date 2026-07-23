import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../../common/access/current-user.decorator.js';
import { PublicEndpoint } from '../../common/access/public-endpoint.decorator.js';
import type { SessionPrincipal } from './session/authenticated-request.js';
import { AuthService } from './auth.service.js';
import type { AuthProfile } from './auth.types.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { SessionCookieService } from './session/session-cookie.service.js';

@Controller('auth')
export class AuthController {
  public constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(SessionCookieService)
    private readonly cookies: SessionCookieService,
  ) {}

  @PublicEndpoint()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  public async googleLogin(
    @Body() body: GoogleLoginDto,
    @Headers('user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthProfile> {
    const result = await this.auth.loginWithGoogle(body.credential, userAgent);
    this.cookies.setSession(
      response,
      result.sessionToken,
      result.sessionExpiresAt,
    );
    return { user: result.user, activeHousehold: result.activeHousehold };
  }

  @Get('me')
  public me(@CurrentUser() principal: SessionPrincipal): Promise<AuthProfile> {
    return this.auth.getProfile(principal.userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async logout(
    @CurrentUser() principal: SessionPrincipal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(principal.sessionId, principal.userId);
    this.cookies.clearSession(response);
  }
}
