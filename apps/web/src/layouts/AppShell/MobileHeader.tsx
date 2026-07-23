import { BrandMark } from '../../components/ui/BrandMark/BrandMark.js';
import type { AppShellUser } from './app-shell.types.js';
import { EnvironmentBadge } from './EnvironmentBadge.js';
import { QuickCreateButton } from './QuickCreateButton.js';
import { UserMenu } from './UserMenu.js';

interface MobileHeaderProps extends AppShellUser {
  environmentLabel: string | null;
  householdName: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}

export function MobileHeader(props: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-sticky) flex min-h-(--navigation-mobile-header-height) items-center gap-3 border-b border-border bg-bottom-navigation/95 px-4 backdrop-blur-sm md:hidden">
      <BrandMark compact />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-body-sm font-semibold text-text">
            HomeApp
          </p>
          <EnvironmentBadge label={props.environmentLabel} />
        </div>
        <p className="truncate text-caption text-text-muted">
          {props.householdName}
        </p>
      </div>
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
