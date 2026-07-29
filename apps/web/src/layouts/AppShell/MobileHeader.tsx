import type { AppShellUser } from './app-shell.types.js';
import { EnvironmentBadge } from './EnvironmentBadge.js';
import { QuickCreateButton } from './QuickCreateButton.js';
import { UserMenu } from './UserMenu.js';
import { HomeBrandButton } from './HomeBrandButton.js';

interface MobileHeaderProps extends AppShellUser {
  environmentLabel: string | null;
  householdName: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export function MobileHeader(props: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-sticky) flex min-h-(--navigation-mobile-header-height) items-center gap-3 border-b border-border bg-bottom-navigation/95 px-4 backdrop-blur-sm md:hidden">
      <HomeBrandButton compact className="min-w-0 flex-1">
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-body-sm font-semibold text-text">
              HomeApp
            </span>
            <EnvironmentBadge label={props.environmentLabel} />
          </span>
          <span className="block truncate text-caption text-text-muted">
            {props.householdName}
          </span>
        </span>
      </HomeBrandButton>
      <QuickCreateButton compact />
      <UserMenu
        avatarUrl={props.avatarUrl}
        displayName={props.displayName}
        isLoggingOut={props.isLoggingOut}
        onLogout={props.onLogout}
      />
    </header>
  );
}
