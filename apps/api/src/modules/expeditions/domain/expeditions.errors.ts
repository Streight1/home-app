import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const expeditionsInvalid = (message: string) =>
  new ApiException(
    HttpStatus.BAD_REQUEST,
    'EXPEDITIONS_INVALID_INPUT',
    message,
  );

export const expeditionsNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'EXPEDITIONS_NOT_FOUND',
    'Položka nebyla nalezena.',
  );

export const imageSearchUnavailable = () =>
  new ApiException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'GEAR_IMAGE_SEARCH_UNAVAILABLE',
    'Vyhledávání fotografií není nakonfigurované. Nahrajte vlastní fotografii nebo vložte přímou HTTPS adresu.',
  );
