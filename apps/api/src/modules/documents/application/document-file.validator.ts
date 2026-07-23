import { createHash } from 'node:crypto';
import { extname, posix } from 'node:path';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { ApiException } from '../../../common/errors/api-exception.js';
import { AppConfigService } from '../../../config/app-config.service.js';
import { invalidDocumentFile } from '../domain/document.errors.js';

interface IncomingDocumentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ValidatedDocumentFile {
  originalFilename: string;
  sanitizedFilename: string;
  extension: string;
  mimeType: string;
  detectedMimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  buffer: Buffer;
}

const allowedExtensions = new Map<string, readonly string[]>([
  ['application/pdf', ['.pdf']],
  ['image/jpeg', ['.jpg', '.jpeg']],
  ['image/png', ['.png']],
  ['text/plain', ['.txt']],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ['.docx'],
  ],
  [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ['.xlsx'],
  ],
]);

function hasPrefix(buffer: Buffer, signature: readonly number[]): boolean {
  return signature.every((byte, index) => buffer[index] === byte);
}

function cleanOriginalFilename(input: string): string {
  const withoutPath = posix.basename(input.replaceAll('\\', '/'));
  const withoutControls = Array.from(withoutPath)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .trim();
  return withoutControls.slice(0, 200).trim();
}

function sanitizeFilename(input: string): string {
  return input
    .replace(/["\\/%?*:|<>]/g, '_')
    .slice(0, 200)
    .trim();
}

function isValidText(buffer: Buffer): boolean {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class DocumentFileValidator {
  public constructor(
    @Inject(AppConfigService) private readonly config: AppConfigService,
  ) {}

  public async validate(
    file: IncomingDocumentFile,
  ): Promise<ValidatedDocumentFile> {
    if (file.size === 0 || file.buffer.length === 0)
      throw invalidDocumentFile('Soubor nesmí být prázdný.');
    if (
      file.size > this.config.maxUploadBytes ||
      file.buffer.length > this.config.maxUploadBytes
    ) {
      throw new ApiException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        'DOCUMENT_FILE_TOO_LARGE',
        'Soubor překračuje povolenou velikost.',
      );
    }

    const originalFilename = cleanOriginalFilename(file.originalname);
    if (!originalFilename)
      throw invalidDocumentFile('Soubor musí mít platný název.');
    const mimeType = file.mimetype.trim().toLowerCase();
    const extensions = allowedExtensions.get(mimeType);
    const extension = extname(originalFilename).toLowerCase();
    if (!extensions?.includes(extension))
      throw invalidDocumentFile('Tento typ souboru není podporovaný.');

    const detectedMimeType = await this.detectContentType(
      mimeType,
      file.buffer,
    );
    return {
      originalFilename,
      sanitizedFilename: sanitizeFilename(originalFilename),
      extension: extension.slice(1),
      mimeType,
      detectedMimeType,
      sizeBytes: file.buffer.length,
      checksumSha256: createHash('sha256').update(file.buffer).digest('hex'),
      buffer: file.buffer,
    };
  }

  private async detectContentType(
    mimeType: string,
    buffer: Buffer,
  ): Promise<string> {
    if (mimeType === 'text/plain') {
      if (!isValidText(buffer))
        throw invalidDocumentFile('Obsah textového souboru není platný.');
      return 'text/plain';
    }

    if (
      (mimeType === 'application/pdf' &&
        !hasPrefix(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) ||
      (mimeType === 'image/jpeg' && !hasPrefix(buffer, [0xff, 0xd8, 0xff])) ||
      (mimeType === 'image/png' &&
        !hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      throw invalidDocumentFile('Obsah souboru neodpovídá uvedenému typu.');
    }

    const detected = await fileTypeFromBuffer(buffer);
    if (detected?.mime !== mimeType)
      throw invalidDocumentFile('Obsah souboru neodpovídá uvedenému typu.');
    return detected.mime;
  }
}
