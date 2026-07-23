import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className = '', error, hint, id, label, ...props }, ref) {
    const textareaId =
      id ?? `textarea-${label.toLowerCase().replaceAll(' ', '-')}`;
    const descriptionId =
      error || hint ? `${textareaId}-description` : undefined;
    return (
      <label
        className="grid gap-2 text-body-sm font-medium text-text"
        htmlFor={textareaId}
      >
        {label}
        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={descriptionId}
          aria-invalid={error ? true : undefined}
          className={`min-h-28 w-full resize-y rounded-md border bg-input px-3 py-2.5 text-body-sm text-text placeholder:text-text-subtle transition-[border-color,background-color,box-shadow] hover:border-border-strong focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled-surface disabled:text-disabled-foreground ${error ? 'border-danger' : 'border-border'} ${className}`}
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
      </label>
    );
  },
);
