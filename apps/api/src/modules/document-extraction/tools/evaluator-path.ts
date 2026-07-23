import { isAbsolute, resolve } from 'node:path';

export function resolveEvaluatorInput(
  input: string,
  initialWorkingDirectory = process.env.INIT_CWD ?? process.cwd(),
): string {
  return isAbsolute(input) ? input : resolve(initialWorkingDirectory, input);
}
