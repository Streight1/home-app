import type { PublicHousehold } from '../households/household.types.js';

export interface VerifiedGoogleIdentity {
  subject: string;
  email: string;
  emailVerified: true;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface AuthProfile {
  user: PublicUser;
  activeHousehold: PublicHousehold;
}

export interface LoginResult extends AuthProfile {
  sessionToken: string;
  sessionExpiresAt: Date;
}
