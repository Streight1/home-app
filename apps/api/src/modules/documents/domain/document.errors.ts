import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export function documentNotFound(): ApiException {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    'DOCUMENT_NOT_FOUND',
    'Dokument nebyl nalezen.',
  );
}

export function invalidDocumentInput(message: string): ApiException {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    'DOCUMENT_INVALID_INPUT',
    message,
  );
}

export function invalidDocumentFile(message: string): ApiException {
  return new ApiException(
    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    'DOCUMENT_INVALID_FILE',
    message,
  );
}

export function invalidDocumentState(message: string): ApiException {
  return new ApiException(
    HttpStatus.CONFLICT,
    'DOCUMENT_INVALID_STATE',
    message,
  );
}
