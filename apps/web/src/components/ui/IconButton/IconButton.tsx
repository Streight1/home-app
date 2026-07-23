import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: ReactNode;
  loading?: boolean;
  variant?: 'default' | 'ghost';
}

export function IconButton({
  children,
  className = '',
  loading = false,
  variant = 'default',
  disabled,
  type = 'button',
  ...props
}: IconButtonProps) {
  const variantClass =
    variant === 'ghost'
      ? 'border-transparent bg-transparent hover:bg-surface-hover'
      : 'border-border bg-surface-raised hover:border-border-strong hover:bg-surface-hover';
  return (
    <button
      type={type}
      className={`inline-grid size-11 shrink-0 place-items-center rounded-md border text-text transition-[background-color,border-color,color,transform] duration-(--motion-fast) active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100 ${variantClass} ${className}`}
      disabled={(disabled ?? false) || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
