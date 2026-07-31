import { Injectable } from '@nestjs/common';
import { isDateOnly } from '../../../../common/time/date-only.js';
import { invalidDocumentInput } from '../../domain/document.errors.js';
import type {
  DocumentLineItem,
  DocumentMetadataRecord,
  DocumentMetadataValue,
} from '../../domain/document.repository.js';
import type {
  DocumentTypeKey,
  MetadataFieldDefinition,
} from '../../domain/metadata/document-type.js';
import { DocumentTypeRegistryService } from './document-type-registry.service.js';

export type DocumentMetadata = DocumentMetadataRecord;

const decimalPattern = /^-?\d+(?:\.\d+)?$/;

@Injectable()
export class ValidateDocumentMetadataService {
  public constructor(private readonly registry: DocumentTypeRegistryService) {}

  public validate(
    type: DocumentTypeKey,
    schemaVersion: number,
    input: unknown,
  ): DocumentMetadata {
    const definition = this.registry.get(type);
    if (
      !definition ||
      schemaVersion < 1 ||
      schemaVersion > definition.schemaVersion
    )
      throw invalidDocumentInput(
        'Typ dokumentu nebo verze metadat není podporovaná.',
      );
    if (typeof input !== 'object' || input === null || Array.isArray(input))
      throw invalidDocumentInput('Metadata musí být JSON objekt.');
    const values = input as Record<string, unknown>;
    const fields = new Map(
      definition.fields.map((field) => [field.key, field]),
    );
    for (const key of Object.keys(values)) {
      if (!fields.has(key))
        throw invalidDocumentInput(`Metadata obsahují nepovolené pole ${key}.`);
    }
    const output: DocumentMetadata = {};
    for (const field of definition.fields) {
      const value = values[field.key];
      if (value === undefined || value === null || value === '') {
        if (field.required)
          throw invalidDocumentInput(`Pole ${field.label} je povinné.`);
        continue;
      }
      output[field.key] = this.validateField(field, value);
    }
    return output;
  }

  private validateField(
    field: MetadataFieldDefinition,
    value: unknown,
  ): DocumentMetadataValue {
    if (field.type === 'LINE_ITEMS')
      return this.validateLineItems(field, value);
    if (field.type === 'BOOLEAN') {
      if (typeof value !== 'boolean')
        throw invalidDocumentInput(`Pole ${field.label} musí být ano/ne.`);
      return value;
    }
    if (field.type === 'INTEGER' || field.type === 'MONEY_MINOR') {
      if (typeof value !== 'number' || !Number.isSafeInteger(value))
        throw invalidDocumentInput(`Pole ${field.label} musí být celé číslo.`);
      return value;
    }
    if (typeof value !== 'string')
      throw invalidDocumentInput(`Pole ${field.label} musí být text.`);
    const normalized = value.trim();
    if (field.maxLength && normalized.length > field.maxLength)
      throw invalidDocumentInput(`Pole ${field.label} je příliš dlouhé.`);
    if (field.type === 'DATE' && !isDateOnly(normalized))
      throw invalidDocumentInput(
        `Pole ${field.label} musí být datum ve formátu RRRR-MM-DD.`,
      );
    if (field.type === 'DECIMAL' && !decimalPattern.test(normalized))
      throw invalidDocumentInput(
        `Pole ${field.label} musí být desetinné číslo s tečkou.`,
      );
    if (
      (field.type === 'CURRENCY' || field.type === 'ENUM') &&
      !field.options?.includes(normalized)
    )
      throw invalidDocumentInput(
        `Pole ${field.label} obsahuje nepovolenou hodnotu.`,
      );
    return normalized;
  }

  private validateLineItems(
    field: MetadataFieldDefinition,
    value: unknown,
  ): DocumentLineItem[] {
    if (!Array.isArray(value) || value.length > 200)
      throw invalidDocumentInput(
        `Pole ${field.label} musí být seznam položek.`,
      );
    return value.map((item, index) => {
      if (typeof item !== 'object' || item === null || Array.isArray(item))
        throw invalidDocumentInput(`Položka ${String(index + 1)} není platná.`);
      const source = item as Record<string, unknown>;
      const allowed = new Set([
        'description',
        'quantity',
        'unit',
        'unitPriceMinor',
        'vatRate',
        'totalAmountMinor',
      ]);
      if (Object.keys(source).some((key) => !allowed.has(key)))
        throw invalidDocumentInput(
          `Položka ${String(index + 1)} obsahuje nepovolené pole.`,
        );
      if (typeof source.description !== 'string' || !source.description.trim())
        throw invalidDocumentInput(
          `Položka ${String(index + 1)} musí mít popis.`,
        );
      const description = source.description.trim().slice(0, 500);
      const result: DocumentLineItem = { description };
      for (const key of ['quantity', 'unit', 'vatRate'] as const) {
        const candidate = source[key];
        if (candidate !== undefined) {
          if (typeof candidate !== 'string' || candidate.length > 40)
            throw invalidDocumentInput(
              `Položka ${String(index + 1)} není platná.`,
            );
          result[key] = candidate.trim();
        }
      }
      for (const key of ['unitPriceMinor', 'totalAmountMinor'] as const) {
        const candidate = source[key];
        if (candidate !== undefined) {
          if (typeof candidate !== 'number' || !Number.isSafeInteger(candidate))
            throw invalidDocumentInput(
              `Položka ${String(index + 1)} musí mít částku v minor units.`,
            );
          result[key] = candidate;
        }
      }
      return result;
    });
  }
}
