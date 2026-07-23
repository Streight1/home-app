import type { VerifiedGoogleIdentity } from '../auth.types.js';

export const GOOGLE_TOKEN_VERIFIER = Symbol('GOOGLE_TOKEN_VERIFIER');

export interface GoogleTokenVerifierPort {
  verify(credential: string): Promise<VerifiedGoogleIdentity>;
}
