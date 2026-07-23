import type { ReactNode } from 'react';

export interface AppShellUser {
  avatarUrl: string | null;
  displayName: string;
}

export interface AppShellProps extends AppShellUser {
  children: ReactNode;
  environmentLabel?: string | null;
  householdName: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}
