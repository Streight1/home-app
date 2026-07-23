import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', error, hint, id, label, ...props },
  ref,
) {
  const inputId = id ?? `input-${label.toLowerCase().replaceAll(' ', '-')}`;
  const descriptionId = error || hint ? `${inputId}-description` : undefined;
  return (
    <div className="grid gap-2 text-body-sm font-medium text-text">
      <label htmlFor={inputId}>{label}</label>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={descriptionId}
        aria-invalid={error ? true : undefined}
        className={`min-h-11 w-full rounded-md border bg-input px-3 text-body-sm text-text placeholder:text-text-subtle transition-[border-color,background-color,box-shadow] hover:border-border-strong focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled-surface disabled:text-disabled-foreground ${error ? 'border-danger' : 'border-border'} ${className}`}
        {...props}
      />
      {error || hint ? (
        <span
          id={descriptionId}
          className={`text-caption font-normal ${error ? 'text-danger' : 'text-text-muted'}`}
        >
          {error ?? hint}
        </span>
      ) : null}
    </div>
  );
});
