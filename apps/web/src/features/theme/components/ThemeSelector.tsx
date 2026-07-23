import { Laptop, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../../../components/ui/DropdownMenu/DropdownMenu.js';
import { useTheme } from '../hooks/useTheme.js';
import { isThemePreference } from '../lib/themeStorage.js';
import type { ThemePreference } from '../types/theme.types.js';

const themeOptions = [
  { value: 'system', label: 'Podle systému', icon: Laptop },
  { value: 'light', label: 'Světlý', icon: Sun },
  { value: 'dark', label: 'Tmavý', icon: Moon },
] as const satisfies readonly {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
}[];

export function ThemeSelector({
  presentation = 'segmented',
  label = 'Barevný motiv',
}: {
  presentation?: 'segmented' | 'menu';
  label?: string;
}) {
  const theme = useTheme();
  const groupName = useId();
  const handleValueChange = (value: string) => {
    if (isThemePreference(value)) theme.setPreference(value);
  };

  if (presentation === 'menu') {
    return (
      <DropdownMenuRadioGroup
        value={theme.preference}
        onValueChange={handleValueChange}
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <Icon className="size-4" aria-hidden="true" />
              {option.label}
            </DropdownMenuRadioItem>
          );
        })}
      </DropdownMenuRadioGroup>
    );
  }

  return (
    <fieldset>
      <legend className="mb-2 text-body-sm font-semibold text-text">
        {label}
      </legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-canvas-subtle p-1">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className="relative flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-md px-1 text-center text-caption font-medium text-text-muted transition-colors hover:bg-surface-hover has-[:checked]:bg-selected has-[:checked]:text-primary-emphasis has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus sm:min-h-11 sm:flex-row sm:gap-2 sm:px-2"
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={theme.preference === option.value}
                onChange={() => theme.setPreference(option.value)}
                className="sr-only"
              />
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-caption text-text-muted" aria-live="polite">
        Aktivní vzhled: {theme.resolvedTheme === 'dark' ? 'tmavý' : 'světlý'}.
      </p>
    </fieldset>
  );
}
