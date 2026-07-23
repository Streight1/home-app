import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';

interface SheetProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  side?: 'right' | 'bottom';
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const sideClasses = {
  right:
    'right-0 top-0 h-full w-[min(26rem,calc(100vw-1rem))] border-l data-[state=open]:animate-in data-[state=closed]:animate-out',
  bottom:
    'bottom-0 left-0 max-h-[85vh] w-full rounded-t-xl border-t data-[state=open]:animate-in data-[state=closed]:animate-out',
} as const;

export function Sheet({
  trigger,
  title,
  description,
  children,
  side = 'right',
  defaultOpen = false,
  open,
  onOpenChange,
}: SheetProps) {
  return (
    <DialogPrimitive.Root
      defaultOpen={defaultOpen}
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="aurora-overlay fixed inset-0 z-(--z-overlay)" />
        <DialogPrimitive.Content
          className={`aurora-popover fixed z-(--z-dialog) overflow-y-auto border-border-strong bg-surface-raised p-5 text-text shadow-lg focus:outline-none ${sideClasses[side]}`}
        >
          <div className="pr-12">
            <DialogPrimitive.Title className="text-section-title font-semibold tracking-tight">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-1 text-body-sm text-text-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close asChild>
            <IconButton
              aria-label="Zavřít panel"
              variant="ghost"
              className="absolute right-3 top-3"
            >
              <X className="size-5" aria-hidden="true" />
            </IconButton>
          </DialogPrimitive.Close>
          <div className="mt-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const SheetClose = DialogPrimitive.Close;
