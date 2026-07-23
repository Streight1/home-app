import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  label: string;
  defaultOpen?: boolean;
  align?: 'start' | 'center' | 'end';
}

export function DropdownMenu({
  trigger,
  children,
  label,
  defaultOpen = false,
  align = 'end',
}: DropdownMenuProps) {
  return (
    <DropdownPrimitive.Root defaultOpen={defaultOpen}>
      <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content
          align={align}
          sideOffset={8}
          aria-label={label}
          className="aurora-popover z-(--z-dialog) min-w-60 rounded-lg border border-border bg-surface-raised p-1.5 text-body-sm text-text shadow-md"
        >
          {children}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}

interface DropdownMenuItemProps {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
  checked?: boolean;
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled = false,
  danger = false,
  checked,
}: DropdownMenuItemProps) {
  return (
    <DropdownPrimitive.Item
      disabled={disabled}
      {...(onSelect ? { onSelect } : {})}
      className={`flex min-h-11 cursor-default select-none items-center gap-2 rounded-md px-3 outline-none data-[disabled]:opacity-45 data-[highlighted]:bg-surface-hover ${danger ? 'text-danger' : 'text-text'}`}
    >
      {checked !== undefined ? (
        <span className="grid size-4 place-items-center" aria-hidden="true">
          {checked ? <Check className="size-4" /> : null}
        </span>
      ) : null}
      {children}
    </DropdownPrimitive.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownPrimitive.Label className="px-3 py-2 text-caption font-semibold uppercase tracking-wide text-text-subtle">
      {children}
    </DropdownPrimitive.Label>
  );
}

export function DropdownMenuSeparator() {
  return <DropdownPrimitive.Separator className="my-1 h-px bg-border" />;
}

export function DropdownMenuRadioGroup({
  children,
  value,
  onValueChange,
}: {
  children: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <DropdownPrimitive.RadioGroup value={value} onValueChange={onValueChange}>
      {children}
    </DropdownPrimitive.RadioGroup>
  );
}

export function DropdownMenuRadioItem({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
}) {
  return (
    <DropdownPrimitive.RadioItem
      value={value}
      className="flex min-h-11 cursor-default select-none items-center gap-2 rounded-md px-3 text-text outline-none data-[highlighted]:bg-surface-hover"
    >
      <span className="grid size-4 place-items-center" aria-hidden="true">
        <DropdownPrimitive.ItemIndicator>
          <Check className="size-4 text-primary" />
        </DropdownPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownPrimitive.RadioItem>
  );
}
