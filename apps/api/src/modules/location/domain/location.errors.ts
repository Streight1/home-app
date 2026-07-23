import { HttpStatus } from '@nestjs/common';
import { ApiException } from '../../../common/errors/api-exception.js';

export const locationInvalidInput = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, 'LOCATION_INVALID_INPUT', message);

export const locationNotFound = () =>
  new ApiException(
    HttpStatus.NOT_FOUND,
    'LOCATION_NOT_FOUND',
    'Místo nebylo nalezeno.',
  );

export const locationProviderUnavailable = () =>
  new ApiException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'LOCATION_PROVIDER_UNAVAILABLE',
    'Místa se nyní nepodařilo načíst.',
  );

export const locationProviderNotConfigured = () =>
  new ApiException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'LOCATION_PROVIDER_NOT_CONFIGURED',
    'Vyhledávání míst není na serveru nakonfigurováno.',
  );

export const locationProviderForbidden = () =>
  new ApiException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'LOCATION_PROVIDER_FORBIDDEN',
    'Vyhledávání míst nemá platné oprávnění poskytovatele.',
  );

export const routeUnavailable = () =>
  new ApiException(
    HttpStatus.SERVICE_UNAVAILABLE,
    'ROUTE_ESTIMATE_UNAVAILABLE',
    'Odhad cesty se nepodařilo vypočítat.',
  );
