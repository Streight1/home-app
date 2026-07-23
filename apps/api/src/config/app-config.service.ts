import { fileURLToPath } from 'node:url';
import { isAbsolute, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  normalizeAllowedEmails,
  type AppEnvironment,
} from './app-config.schema.js';

@Injectable()
export class AppConfigService {
  public constructor(
    private readonly config: NestConfigService<AppEnvironment, true>,
  ) {}

  public get nodeEnv(): AppEnvironment['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  public get port(): number {
    return this.config.get('API_PORT', { infer: true });
  }

  public get databaseUrl(): string {
    return this.config.get('DATABASE_URL', { infer: true });
  }

  public get webOrigin(): string {
    return this.config.get('WEB_ORIGIN', { infer: true });
  }

  public get googleClientId(): string {
    return this.config.get('GOOGLE_CLIENT_ID', { infer: true });
  }

  public get googleAllowedEmails(): readonly string[] {
    return normalizeAllowedEmails(
      this.config.get('GOOGLE_ALLOWED_EMAILS', { infer: true }),
    );
  }

  public get singleHouseholdMode(): boolean {
    return this.config.get('SINGLE_HOUSEHOLD_MODE', { infer: true });
  }

  public get singleHouseholdOwnerEmail(): string {
    return this.config
      .get('SINGLE_HOUSEHOLD_OWNER_EMAIL', { infer: true })
      .trim()
      .toLowerCase();
  }

  public get singleHouseholdName(): string {
    return this.config.get('SINGLE_HOUSEHOLD_NAME', { infer: true }).trim();
  }

  public get sessionCookieName(): string {
    return this.config.get('SESSION_COOKIE_NAME', { infer: true });
  }

  public get csrfCookieName(): string {
    return this.config.get('CSRF_COOKIE_NAME', { infer: true });
  }

  public get sessionTtlDays(): number {
    return this.config.get('SESSION_TTL_DAYS', { infer: true });
  }

  public get trustProxy(): boolean {
    return this.config.get('TRUST_PROXY', { infer: true });
  }

  public get internalHealthToken(): string {
    return this.config.get('INTERNAL_HEALTH_TOKEN', { infer: true });
  }

  public get workspaceRoot(): string {
    return fileURLToPath(new URL('../../../../', import.meta.url));
  }

  public get uploadRoot(): string {
    const configured = this.config.get('UPLOAD_ROOT', { infer: true });
    return resolve(
      isAbsolute(configured)
        ? configured
        : resolve(this.workspaceRoot, configured),
    );
  }

  public get maxUploadBytes(): number {
    return this.config.get('MAX_UPLOAD_BYTES', { infer: true });
  }

  public get financeImportMaxFileBytes(): number {
    return this.config.get('FINANCE_IMPORT_MAX_FILE_BYTES', { infer: true });
  }

  public get financeImportMaxRows(): number {
    return this.config.get('FINANCE_IMPORT_MAX_ROWS', { infer: true });
  }

  public get financeImportSessionTtlHours(): number {
    return this.config.get('FINANCE_IMPORT_SESSION_TTL_HOURS', { infer: true });
  }

  public get mapyApiEnabled(): boolean {
    return this.config.get('MAPY_API_ENABLED', { infer: true });
  }
  public get mapyApiKey(): string {
    return this.config.get('MAPY_API_KEY', { infer: true });
  }
  public get mapyApiTimeoutMs(): number {
    return this.config.get('MAPY_API_TIMEOUT_MS', { infer: true });
  }
  public get mapySuggestMinQueryLength(): number {
    return this.config.get('MAPY_SUGGEST_MIN_QUERY_LENGTH', { infer: true });
  }
  public get mapySuggestMaxResults(): number {
    return this.config.get('MAPY_SUGGEST_MAX_RESULTS', { infer: true });
  }
  public get mapyDefaultLanguage(): AppEnvironment['MAPY_DEFAULT_LANGUAGE'] {
    return this.config.get('MAPY_DEFAULT_LANGUAGE', { infer: true });
  }

  public get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
