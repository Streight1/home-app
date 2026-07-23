import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const slotChanged = () =>
  new ApiException(
    HttpStatus.CONFLICT,
    'SCHEDULING_SLOT_CHANGED',
    'Kalendář se mezitím změnil. Nechte si navrhnout nový čas.',
  );

export const taskAlreadyScheduled = () =>
  new ApiException(
    HttpStatus.CONFLICT,
    'TASK_ALREADY_SCHEDULED',
    'Úkol už je v kalendáři naplánovaný.',
  );

export const invalidSchedulingInput = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'SCHEDULING_INVALID_INPUT', message);
