import { LogOut, UserRound } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar/Avatar.js';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../components/ui/DropdownMenu/DropdownMenu.js';
import { IconButton } from '../../components/ui/IconButton/IconButton.js';
import { ThemeSelector } from '../../features/theme/components/ThemeSelector.js';
import type { AppShellUser } from './app-shell.types.js';

interface UserMenuProps extends AppShellUser {
  isLoggingOut: boolean;
  onLogout: () => void;
}

export function UserMenu({
  avatarUrl,
  displayName,
  isLoggingOut,
  onLogout,
}: UserMenuProps) {
  return (
    <DropdownMenu
      label="Uživatelské menu"
      trigger={
        <IconButton
          aria-label={`Uživatelské menu: ${displayName}`}
          variant="ghost"
        >
          <Avatar imageUrl={avatarUrl} name={displayName} size="sm" />
        </IconButton>
      }
    >
      <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
      <DropdownMenuItem disabled>
        <UserRound className="size-4" aria-hidden="true" />
        Profil se připravuje
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Vzhled</DropdownMenuLabel>
      <ThemeSelector presentation="menu" />
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onLogout} disabled={isLoggingOut} danger>
        <LogOut className="size-4" aria-hidden="true" />
        {isLoggingOut ? 'Odhlašujeme…' : 'Odhlásit se'}
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
