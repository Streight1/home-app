import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const maintenanceNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'MAINTENANCE_NOT_FOUND',
    'Záznam údržby nebyl nalezen.',
  );

export const maintenanceInvalid = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'MAINTENANCE_INVALID', message);

export const maintenanceConflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, 'MAINTENANCE_CONFLICT', message);
