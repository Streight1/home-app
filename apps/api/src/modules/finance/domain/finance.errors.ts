import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const financeNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'FINANCE_NOT_FOUND',
    'Finanční záznam nebyl nalezen.',
  );

export const financeInvalid = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'FINANCE_INVALID_INPUT', message);

export const financeConflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, 'FINANCE_CONFLICT', message);
