import { z } from 'zod';
import { resolveSecretEnvironment } from './secret-file-resolver.js';

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const cookieName = z.string().regex(/^[A-Za-z0-9_-]+$/);

const appConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    API_PORT: z.coerce.number().int().min(1).max(65_535),
    DATABASE_URL: z.url().startsWith('postgresql://'),
    WEB_ORIGIN: z.url(),
    GOOGLE_CLIENT_ID: z.string().trim().min(1),
    GOOGLE_ALLOWED_EMAILS: z.string().default(''),
    SINGLE_HOUSEHOLD_MODE: booleanFromString.default(false),
    SINGLE_HOUSEHOLD_OWNER_EMAIL: z.string().trim().default(''),
    SINGLE_HOUSEHOLD_NAME: z.string().trim().default(''),
    SESSION_COOKIE_NAME: cookieName,
    CSRF_COOKIE_NAME: cookieName,
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365),
    TRUST_PROXY: booleanFromString,
    INTERNAL_HEALTH_TOKEN: z.string().min(32),
    UPLOAD_ROOT: z.string().trim().min(1),
    MAX_UPLOAD_BYTES: z.coerce.number().int().min(1).max(1_073_741_824),
    FINANCE_IMPORT_MAX_FILE_BYTES: z.coerce
      .number()
      .int()
      .min(1)
      .max(104_857_600)
      .default(20_971_520),
    FINANCE_IMPORT_MAX_ROWS: z.coerce
      .number()
      .int()
      .min(1)
      .max(1_000_000)
      .default(100_000),
    FINANCE_IMPORT_SESSION_TTL_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(720)
      .default(24),
    MAPY_API_ENABLED: booleanFromString.default(false),
    MAPY_API_KEY: z.string().trim().default(''),
    MAPY_API_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(30_000)
      .default(5000),
    MAPY_SUGGEST_MIN_QUERY_LENGTH: z.coerce
      .number()
      .int()
      .min(2)
      .max(20)
      .default(3),
    MAPY_SUGGEST_MAX_RESULTS: z.coerce.number().int().min(1).max(15).default(8),
    MAPY_DEFAULT_LANGUAGE: z
      .enum([
        'cs',
        'de',
        'el',
        'en',
        'es',
        'fr',
        'it',
        'nl',
        'pl',
        'pt',
        'ru',
        'sk',
        'tr',
        'uk',
      ])
      .default('cs'),
  })
  .superRefine((environment, context) => {
    if (environment.MAPY_API_ENABLED && !environment.MAPY_API_KEY) {
      context.addIssue({
        code: 'custom',
        message: 'MAPY_API_KEY is required when MAPY_API_ENABLED=true',
        path: ['MAPY_API_KEY'],
      });
    }
    const allowedEmails = normalizeAllowedEmails(
      environment.GOOGLE_ALLOWED_EMAILS,
    );
    const ownerEmail = environment.SINGLE_HOUSEHOLD_OWNER_EMAIL.toLowerCase();
    if (environment.SINGLE_HOUSEHOLD_MODE) {
      if (!ownerEmail) {
        context.addIssue({
          code: 'custom',
          message:
            'SINGLE_HOUSEHOLD_OWNER_EMAIL is required in single-household mode',
          path: ['SINGLE_HOUSEHOLD_OWNER_EMAIL'],
        });
      } else if (!z.email().safeParse(ownerEmail).success) {
        context.addIssue({
          code: 'custom',
          message: 'SINGLE_HOUSEHOLD_OWNER_EMAIL must be a valid email',
          path: ['SINGLE_HOUSEHOLD_OWNER_EMAIL'],
        });
      } else if (!allowedEmails.includes(ownerEmail)) {
        context.addIssue({
          code: 'custom',
          message:
            'SINGLE_HOUSEHOLD_OWNER_EMAIL must be included in GOOGLE_ALLOWED_EMAILS',
          path: ['SINGLE_HOUSEHOLD_OWNER_EMAIL'],
        });
      }
      if (!environment.SINGLE_HOUSEHOLD_NAME) {
        context.addIssue({
          code: 'custom',
          message: 'SINGLE_HOUSEHOLD_NAME is required in single-household mode',
          path: ['SINGLE_HOUSEHOLD_NAME'],
        });
      }
    }
    if (environment.NODE_ENV === 'production' && allowedEmails.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'GOOGLE_ALLOWED_EMAILS must not be empty in production',
        path: ['GOOGLE_ALLOWED_EMAILS'],
      });
    }
    if (
      environment.NODE_ENV === 'production' &&
      environment.WEB_ORIGIN.startsWith('http://')
    ) {
      context.addIssue({
        code: 'custom',
        message: 'WEB_ORIGIN must use HTTPS in production',
        path: ['WEB_ORIGIN'],
      });
    }
  });

export type AppEnvironment = z.infer<typeof appConfigSchema>;

export function normalizeAllowedEmails(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function validateEnvironment(
  input: Record<string, unknown>,
): AppEnvironment {
  const result = appConfigSchema.safeParse(resolveSecretEnvironment(input));
  if (!result.success)
    throw new Error(
      `Neplatná konfigurace prostředí: ${z.prettifyError(result.error)}`,
    );
  return result.data;
}
