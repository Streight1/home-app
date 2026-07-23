import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../Spinner/Spinner.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'aurora-primary-action border-primary text-primary-foreground hover:border-primary-hover',
  secondary:
    'border-border-strong bg-surface-raised text-text hover:bg-surface-hover',
  ghost:
    'border-transparent bg-transparent text-text-secondary hover:bg-surface-hover',
  danger: 'border-danger bg-danger text-danger-foreground hover:brightness-110',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-body-sm',
  md: 'min-h-11 px-4 text-body-sm',
};

export function Button({
  children,
  className = '',
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-(--motion-fast) active:translate-y-px focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled-surface disabled:text-disabled-foreground disabled:opacity-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={(disabled ?? false) || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}
