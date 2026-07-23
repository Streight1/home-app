import { webEnvironment } from '../../../lib/config/environment.js';
import type {
  DocumentMetadata,
  DocumentTypeDefinition,
} from '../types/document.types.js';

export const acceptedDocumentMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export const documentFileAccept = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.txt',
  '.docx',
  '.xlsx',
].join(',');

const mimeExtensions = new Map<string, readonly string[]>([
  ['application/pdf', ['pdf']],
  ['image/jpeg', ['jpg', 'jpeg']],
  ['image/png', ['png']],
  ['text/plain', ['txt']],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ['docx'],
  ],
  [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ['xlsx'],
  ],
]);

function extensionOf(filename: string): string {
  return filename.split('.').at(-1)?.toLowerCase() ?? '';
}

function hasPrefix(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  const modernBlob = blob as Blob & {
    arrayBuffer?: () => Promise<ArrayBuffer>;
  };
  if (typeof modernBlob.arrayBuffer === 'function')
    return modernBlob.arrayBuffer();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Soubor se nepodařilo přečíst.'));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error('Soubor se nepodařilo přečíst.'));
    };
    reader.readAsArrayBuffer(blob);
  });
}

export function titleFromFilename(filename: string): string {
  const normalized = Array.from(filename)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .replace(/\.[^.]+$/, '')
    .trim();
  return normalized.slice(0, 200) || 'Nový dokument';
}

export async function validateDocumentFile(file: File): Promise<string | null> {
  if (!file.name.trim()) return 'Soubor musí mít platný název.';
  if (file.size === 0) return 'Soubor nesmí být prázdný.';
  if (file.size > webEnvironment.maxUploadBytes)
    return 'Soubor překračuje povolenou velikost.';
  const allowedExtensions = mimeExtensions.get(file.type.toLowerCase());
  if (!allowedExtensions?.includes(extensionOf(file.name)))
    return 'Tento typ souboru není podporovaný.';

  const bytes = new Uint8Array(await readBlob(file.slice(0, 8)));
  if (
    (file.type === 'application/pdf' &&
      !hasPrefix(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) ||
    (file.type === 'image/jpeg' && !hasPrefix(bytes, [0xff, 0xd8, 0xff])) ||
    (file.type === 'image/png' &&
      !hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'Obsah souboru neodpovídá uvedenému typu.';
  }
  return null;
}

export function validateDocumentTitle(title: string): string | null {
  const normalized = title.trim();
  if (!normalized) return 'Vyplňte název dokumentu.';
  if (normalized.length > 200) return 'Název může mít nejvýše 200 znaků.';
  return null;
}

export function validateDocumentMetadata(
  definition: DocumentTypeDefinition | undefined,
  values: DocumentMetadata,
): Record<string, string> {
  if (!definition) return {};
  const errors: Record<string, string> = {};
  for (const field of definition.fields) {
    const value = values[field.key];
    if (value === undefined || value === '') {
      if (field.required) errors[field.key] = 'Toto pole je povinné.';
      continue;
    }
    if (
      (field.type === 'INTEGER' || field.type === 'MONEY_MINOR') &&
      (typeof value !== 'number' || !Number.isSafeInteger(value))
    ) {
      errors[field.key] = 'Zadejte celé číslo.';
    }
    if (
      field.maxLength &&
      typeof value === 'string' &&
      value.trim().length > field.maxLength
    ) {
      errors[field.key] = `Zadejte nejvýše ${String(field.maxLength)} znaků.`;
    }
  }
  return errors;
}
