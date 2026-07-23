import { AccessMode, setAccessMode } from './access-mode.decorator.js';

export function PublicEndpoint(): MethodDecorator {
  return setAccessMode(AccessMode.PUBLIC);
}
