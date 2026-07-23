import { SetMetadata } from '@nestjs/common';

export const ACCESS_MODE_KEY = 'life-admin:access-mode';

export enum AccessMode {
  AUTHENTICATED = 'AUTHENTICATED',
  INTERNAL = 'INTERNAL',
  PUBLIC = 'PUBLIC',
}

export function setAccessMode(
  mode: AccessMode,
): MethodDecorator & ClassDecorator {
  return SetMetadata(ACCESS_MODE_KEY, mode);
}
