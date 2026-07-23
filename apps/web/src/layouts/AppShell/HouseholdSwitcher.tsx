import { ChevronsUpDown, House } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button.js';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../components/ui/DropdownMenu/DropdownMenu.js';

export function HouseholdSwitcher({
  householdName,
  compact = false,
}: {
  householdName: string;
  compact?: boolean;
}) {
  return (
    <DropdownMenu
      label="Výběr domácnosti"
      align="start"
      trigger={
        <Button
          variant="ghost"
          className={compact ? 'w-11 px-0' : 'max-w-64 justify-between'}
          aria-label={compact ? `Domácnost: ${householdName}` : undefined}
        >
          <span className="flex min-w-0 items-center gap-2">
            <House className="size-4 shrink-0" aria-hidden="true" />
            {compact ? null : <span className="truncate">{householdName}</span>}
          </span>
          {compact ? null : (
            <ChevronsUpDown className="size-4 shrink-0" aria-hidden="true" />
          )}
        </Button>
      }
    >
      <DropdownMenuLabel>Aktivní domácnost</DropdownMenuLabel>
      <DropdownMenuItem checked>
        <span className="flex-1">{householdName}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem disabled>
        Správa domácností se připravuje
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
