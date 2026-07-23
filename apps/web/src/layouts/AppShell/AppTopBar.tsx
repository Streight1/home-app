import { Search } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button.js';
import { Dialog } from '../../components/ui/Dialog/Dialog.js';
import { Input } from '../../components/ui/Input/Input.js';
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
}

export function AppTopBar(props: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-(--z-sticky) hidden h-(--navigation-topbar-height) items-center border-b border-border bg-surface/90 px-5 backdrop-blur-md md:flex xl:px-6">
      <div className="flex w-full items-center gap-3">
        <HouseholdSwitcher householdName={props.householdName} />
        <Dialog
          title="Hledání"
          description="Globální hledání bude dostupné s prvními datovými moduly."
          trigger={
            <Button
              variant="secondary"
              className="min-w-0 flex-1 justify-start text-text-muted xl:max-w-md"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="truncate">Hledat v domácnosti</span>
              <span className="ml-auto hidden text-caption text-text-muted lg:inline">
                Připravujeme
              </span>
            </Button>
          }
        >
          <Input
            label="Hledat"
            placeholder="Název nebo klíčové slovo"
            disabled
          />
        </Dialog>
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
