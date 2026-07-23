import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { className = '', error, hint, id, label, children, ...props },
    ref,
  ) {
    const selectId = id ?? `select-${label.toLowerCase().replaceAll(' ', '-')}`;
    const descriptionId = error || hint ? `${selectId}-description` : undefined;
    return (
      <label
        className="grid gap-2 text-body-sm font-medium text-text"
        htmlFor={selectId}
      >
        {label}
        <select
          ref={ref}
          id={selectId}
          aria-describedby={descriptionId}
          aria-invalid={error ? true : undefined}
          className={`min-h-11 w-full rounded-md border bg-input px-3 text-body-sm text-text focus-visible:outline-2 focus-visible:outline-focus disabled:bg-disabled-surface disabled:text-disabled-foreground ${error ? 'border-danger' : 'border-border'} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error || hint ? (
          <span
            id={descriptionId}
            className={`text-caption font-normal ${error ? 'text-danger' : 'text-text-muted'}`}
          >
            {error ?? hint}
          </span>
        ) : null}
      </label>
    );
  },
);
