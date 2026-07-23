import { AccessMode, setAccessMode } from './access-mode.decorator.js';

export function InternalEndpoint(): MethodDecorator & ClassDecorator {
  return setAccessMode(AccessMode.INTERNAL);
}
