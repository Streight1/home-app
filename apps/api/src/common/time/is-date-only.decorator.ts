import {
  ValidateBy,
  buildMessage,
  type ValidationOptions,
} from 'class-validator';
import { isDateOnly } from './date-only.js';

export const IS_DATE_ONLY = 'isDateOnly';

/**
 * Validates a calendar date without assigning it an implicit timezone.
 * Unlike a shape-only regular expression, this rejects impossible dates such
 * as 2026-02-30 before an application service receives the request.
 */
export function IsDateOnly(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_DATE_ONLY,
      validator: {
        validate: (value: unknown): boolean =>
          typeof value === 'string' && isDateOnly(value),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be a valid date in YYYY-MM-DD format`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
