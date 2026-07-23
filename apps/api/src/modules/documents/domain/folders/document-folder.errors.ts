import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../../common/errors/api-exception.js';

export function folderNotFound(): ApiException {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    'DOCUMENT_FOLDER_NOT_FOUND',
    'Složka nebyla nalezena.',
  );
}

export function invalidFolder(message: string): ApiException {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    'DOCUMENT_FOLDER_INVALID',
    message,
  );
}

export function duplicateFolder(): ApiException {
  return new ApiException(
    HttpStatus.CONFLICT,
    'DOCUMENT_FOLDER_DUPLICATE',
    'Složka se stejným názvem už na tomto místě existuje.',
  );
}
