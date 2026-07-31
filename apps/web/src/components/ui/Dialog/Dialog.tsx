import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';

interface DialogProps {
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'wide' | 'viewport';
  mobileFullScreen?: boolean;
  dismissible?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-4xl',
  wide: 'max-w-[75rem]',
  viewport: 'h-[85vh] max-w-[90vw]',
} as const;

export function Dialog({
  trigger,
  title,
  description,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  size = 'md',
  mobileFullScreen = false,
  dismissible = true,
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      defaultOpen={defaultOpen}
      {...(open !== undefined ? { open } : {})}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {trigger ? (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      ) : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="aurora-overlay fixed inset-0 z-(--z-overlay)" />
        <DialogPrimitive.Content
          {...(!dismissible
            ? {
                onEscapeKeyDown: (event) => event.preventDefault(),
                onPointerDownOutside: (event) => event.preventDefault(),
              }
            : {})}
          className={`aurora-popover fixed left-1/2 top-1/2 z-(--z-dialog) max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border-strong bg-surface-raised p-6 text-text shadow-lg focus:outline-none sm:p-7 ${sizeClasses[size]} ${mobileFullScreen ? 'max-sm:left-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 max-sm:p-4' : ''}`}
        >
          <div className="pr-12">
            <DialogPrimitive.Title className="text-section-title font-semibold tracking-tight">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-2 text-body-sm text-text-muted">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {dismissible ? (
            <DialogPrimitive.Close asChild>
              <IconButton
                aria-label="Zavřít dialog"
                variant="ghost"
                className="absolute right-3 top-3"
              >
                <X className="size-5" aria-hidden="true" />
              </IconButton>
            </DialogPrimitive.Close>
          ) : null}
          <div className="mt-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DialogClose = DialogPrimitive.Close;
