import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const calendarInvalidInput = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'CALENDAR_INVALID_INPUT', message);

export const calendarNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'CALENDAR_EVENT_NOT_FOUND',
    'Událost nebyla nalezena.',
  );

export const calendarTemplateNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'CALENDAR_TEMPLATE_NOT_FOUND',
    'Šablona nebyla nalezena.',
  );

export const calendarShiftConflict = (count: number) =>
  new ApiException(
    HttpStatus.CONFLICT,
    'CALENDAR_SHIFT_CONFLICT',
    `Směna se překrývá s ${String(count)} existujícími směnami vybraného člena.`,
  );

export const calendarBatchNotRevertible = () =>
  new ApiException(
    HttpStatus.CONFLICT,
    'CALENDAR_BATCH_NOT_REVERTIBLE',
    'Hromadné vložení již nelze bezpečně vrátit, protože některá událost byla upravena.',
  );
