import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <section
      className={`rounded-lg border border-border bg-surface-raised shadow-sm ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
