import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export function extractionNotFound(): ApiException {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    'EXTRACTION_NOT_FOUND',
    'Vytěžení nebylo nalezeno.',
  );
}
export function extractionNotSupported(): ApiException {
  return new ApiException(
    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    'EXTRACTION_NOT_SUPPORTED',
    'Tento typ souboru nelze vytěžit.',
  );
}
export function extractionNotConfigured(): ApiException {
  return new ApiException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'OCR_NOT_CONFIGURED',
    'OCR obrázků není nakonfigurované.',
  );
}
export function extractionTimeout(): ApiException {
  return new ApiException(
    HttpStatus.GATEWAY_TIMEOUT,
    'EXTRACTION_TIMEOUT',
    'Vytěžení překročilo časový limit.',
  );
}
export function invalidExtractionReview(message: string): ApiException {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    'EXTRACTION_INVALID_REVIEW',
    message,
  );
}
