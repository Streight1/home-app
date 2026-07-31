import { Search } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button.js';
import type { AppShellUser } from './app-shell.types.js';
import { EnvironmentBadge } from './EnvironmentBadge.js';
import { HouseholdSwitcher } from './HouseholdSwitcher.js';
import { QuickCreateButton } from './QuickCreateButton.js';
import { UserMenu } from './UserMenu.js';

interface AppTopBarProps extends AppShellUser {
  environmentLabel: string | null;
  householdName: string;
  isLoggingOut: boolean;
  onLogout: () => void;
  onOpenSearch: () => void;
}

export function AppTopBar(props: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-(--z-sticky) hidden h-(--navigation-topbar-height) items-center border-b border-border bg-surface/90 px-5 backdrop-blur-md md:flex xl:px-6">
      <div className="flex w-full items-center gap-3">
        <HouseholdSwitcher householdName={props.householdName} />
        <Button
          variant="secondary"
          className="min-w-0 flex-1 justify-start text-text-muted xl:max-w-md"
          aria-label="Hledat v aplikaci, klávesová zkratka Control nebo Command K"
          onClick={props.onOpenSearch}
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="truncate">Hledat v aplikaci</span>
          <kbd className="ml-auto hidden rounded border border-border bg-surface-subtle px-2 py-0.5 text-caption text-text-muted lg:inline">
            Ctrl / ⌘ K
          </kbd>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <EnvironmentBadge label={props.environmentLabel} />
          <QuickCreateButton />
          <UserMenu
            avatarUrl={props.avatarUrl}
            displayName={props.displayName}
            isLoggingOut={props.isLoggingOut}
            onLogout={props.onLogout}
          />
        </div>
      </div>
    </header>
  );
}
