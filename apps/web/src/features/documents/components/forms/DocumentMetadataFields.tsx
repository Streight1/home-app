import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import type {
  DocumentMetadata,
  DocumentTypeDefinition,
  MetadataValue,
} from '../../types/document.types.js';

interface DocumentMetadataFieldsProps {
  definition: DocumentTypeDefinition | undefined;
  values: DocumentMetadata;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (key: string, value: MetadataValue | undefined) => void;
}

function stringFieldValue(value: MetadataValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

function inputFieldValue(value: MetadataValue | undefined): string | number {
  return typeof value === 'string' || typeof value === 'number' ? value : '';
}

export function DocumentMetadataFields({
  definition,
  values,
  errors = {},
  disabled,
  onChange,
}: DocumentMetadataFieldsProps) {
  if (!definition || definition.fields.length === 0) {
    return (
      <p className="text-body-sm text-text-muted">
        Tento typ nemá další strukturovaná pole.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {definition.fields.map((field) => {
        const error = errors[field.key];
        if (field.type === 'LINE_ITEMS') {
          const items = values[field.key];
          return (
            <div key={field.key} className="sm:col-span-2">
              <p className="text-body-sm font-medium text-text">
                {field.label}
              </p>
              {Array.isArray(items) && items.length > 0 ? (
                <ul className="mt-2 grid gap-2 rounded-md border border-border bg-surface-subtle p-3 text-body-sm text-text-muted">
                  {items.map((item, index) => (
                    <li
                      key={`${item.description}-${String(index)}`}
                      className="break-words"
                    >
                      {item.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-caption text-text-muted">
                  Položky zatím nebyly potvrzeny z vytěžení.
                </p>
              )}
            </div>
          );
        }
        if (field.type === 'BOOLEAN') {
          return (
            <label
              key={field.key}
              className="flex min-h-11 items-center gap-3 text-body-sm font-medium text-text"
            >
              <input
                type="checkbox"
                checked={values[field.key] === true}
                disabled={disabled}
                onChange={(event) => onChange(field.key, event.target.checked)}
                className="size-5 accent-primary focus-visible:outline-2 focus-visible:outline-focus"
              />
              {field.label}
            </label>
          );
        }
        if (field.type === 'CURRENCY' || field.type === 'ENUM') {
          return (
            <Select
              key={field.key}
              label={field.label}
              disabled={disabled}
              required={field.required}
              {...(error ? { error } : {})}
              value={stringFieldValue(values[field.key])}
              onChange={(event) =>
                onChange(field.key, event.target.value || undefined)
              }
            >
              <option value="">Nevyplněno</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          );
        }
        const integer =
          field.type === 'INTEGER' || field.type === 'MONEY_MINOR';
        return (
          <Input
            key={field.key}
            label={field.label}
            disabled={disabled}
            required={field.required}
            {...(error ? { error } : {})}
            type={field.type === 'DATE' ? 'date' : integer ? 'number' : 'text'}
            {...(integer ? { step: 1 } : {})}
            {...(field.maxLength ? { maxLength: field.maxLength } : {})}
            value={inputFieldValue(values[field.key])}
            {...(field.type === 'MONEY_MINOR'
              ? { hint: 'Celé číslo v minor units (např. haléře).' }
              : {})}
            onChange={(event) => {
              const value = event.target.value;
              onChange(
                field.key,
                value === '' ? undefined : integer ? Number(value) : value,
              );
            }}
          />
        );
      })}
    </div>
  );
}
