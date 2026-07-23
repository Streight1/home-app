import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const financeImportInvalid = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'FINANCE_IMPORT_INVALID', message);

export const financeImportNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'FINANCE_IMPORT_NOT_FOUND',
    'Import nebyl nalezen.',
  );

export const financeImportConflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, 'FINANCE_IMPORT_CONFLICT', message);
