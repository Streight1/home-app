import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../../common/errors/api-exception.js';

export function contentDisposition(filename: string, inline: boolean): string {
  const ascii = filename
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export function previewUnsupported(): ApiException {
  return new ApiException(
    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    'DOCUMENT_PREVIEW_UNSUPPORTED',
    'Náhled tohoto typu souboru není podporovaný. Soubor si můžete stáhnout.',
  );
}
