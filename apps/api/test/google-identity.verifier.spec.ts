import { describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../src/config/app-config.service.js';
import { GoogleTokenVerifierService } from '../src/modules/auth/google/google-token-verifier.service.js';

const config = {
  googleClientId: 'client-id.apps.googleusercontent.com',
} as unknown as AppConfigService;

function verifierReturning(
  payload: Record<string, unknown>,
): GoogleTokenVerifierService {
  const verifier = new GoogleTokenVerifierService(config);
  const client = {
    verifyIdToken: vi.fn().mockResolvedValue({ getPayload: () => payload }),
  };
  (verifier as unknown as { client: typeof client }).client = client;
  return verifier;
}

describe('GoogleTokenVerifierService', () => {
  it('rejects a token that google-auth-library cannot verify', async () => {
    const verifier = new GoogleTokenVerifierService(config);
    const client = {
      verifyIdToken: vi.fn().mockRejectedValue(new Error('invalid signature')),
    };
    (verifier as unknown as { client: typeof client }).client = client;
    await expect(verifier.verify('bad-token')).rejects.toMatchObject({
      code: 'AUTH_INVALID_GOOGLE_TOKEN',
    });
  });

  it.each([
    { email: 'jana@example.com', email_verified: true },
    { sub: 'subject', email_verified: true },
    { sub: 'subject', email: 'jana@example.com' },
  ])('rejects required claim errors: %s', async (payload) => {
    await expect(
      verifierReturning(payload).verify('token'),
    ).rejects.toMatchObject({
      code: 'AUTH_INVALID_GOOGLE_IDENTITY',
    });
  });

  it('rejects an unverified email', async () => {
    await expect(
      verifierReturning({
        sub: 'subject',
        email: 'jana@example.com',
        email_verified: false,
      }).verify('token'),
    ).rejects.toMatchObject({
      code: 'AUTH_INVALID_GOOGLE_IDENTITY',
    });
  });
});
