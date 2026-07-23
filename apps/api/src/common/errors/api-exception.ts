import { HttpException, type HttpStatus } from '@nestjs/common';
import type { ApiErrorCode } from './api-error-code.js';

export class ApiException extends HttpException {
  public constructor(
    statusCode: HttpStatus,
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super({ statusCode, code, message }, statusCode);
  }
}
