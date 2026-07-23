import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const financeBudgetNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'FINANCE_NOT_FOUND',
    'Rozpočet nebo záznam nebyl nalezen.',
  );

export const financeBudgetInvalid = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'FINANCE_INVALID_INPUT', message);

export const financeBudgetConflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, 'FINANCE_CONFLICT', message);
