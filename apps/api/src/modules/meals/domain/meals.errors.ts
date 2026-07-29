import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const mealsNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'MEALS_ENTITY_NOT_FOUND',
    'Položka nebyla nalezena.',
  );

export const mealsInvalid = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'MEALS_INPUT_INVALID', message);

export const mealsConflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, 'MEALS_CONFLICT', message);
