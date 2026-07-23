import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export function taskNotFound(): ApiException {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    'TASK_NOT_FOUND',
    'Úkol nebyl nalezen.',
  );
}

export function taskCategoryNotFound(): ApiException {
  return new ApiException(
    HttpStatus.NOT_FOUND,
    'TASK_CATEGORY_NOT_FOUND',
    'Kategorie nebyla nalezena.',
  );
}

export function invalidTaskInput(message: string): ApiException {
  return new ApiException(
    HttpStatus.BAD_REQUEST,
    'TASK_INVALID_INPUT',
    message,
  );
}

export function taskConflict(message: string): ApiException {
  return new ApiException(HttpStatus.CONFLICT, 'TASK_CONFLICT', message);
}
